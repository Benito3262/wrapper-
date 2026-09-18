import { useEffect, useMemo, useState } from "react";
import {
  companies as seedCompanies,
  shortMint,
  strengthLabel,
  type Company,
  type Wrapper,
} from "./data/registry";
import { formatOut, getQuote, getSwapTx, jupiterSwapUrl, type Quote } from "./lib/jupiter";
import {
  connectWallet,
  detectWallets,
  getProvider,
  installLink,
  isMobile,
  type WalletId,
} from "./lib/wallet";
import {
  consumeWalletRedirect,
  readUiState,
  requestPhantomConnect,
  requestPhantomSign,
  requestSolflareConnect,
  savedMobileAddress,
  savedWalletKind,
  saveUiState,
} from "./lib/mobileConnect";
import { loadCatalog } from "./lib/catalog";
import { pythInsightsUrl, resolvePythFeed, type PythFeed } from "./lib/pyth";
import { SPONSORS } from "./lib/sponsors";
import SwapDesk from "./lib/SwapDesk";
import logoMark from "./assets/logo.png";

const RPC =
  (import.meta as { env?: { VITE_SOLANA_RPC?: string } }).env?.VITE_SOLANA_RPC ||
  "https://api.mainnet-beta.solana.com";

type Screen = "home" | "company" | "receipt" | "tools";

export default function WrapperApp() {
  const [q, setQ] = useState("");
  const [screen, setScreen] = useState<Screen>("home");
  const [company, setCompany] = useState<Company | null>(null);
  const [picked, setPicked] = useState<Wrapper | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<WalletId | undefined>();
  const [picker, setPicker] = useState(false);
  const [amount, setAmount] = useState("10");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [sig, setSig] = useState("");
  const [catalog, setCatalog] = useState<Company[]>(seedCompanies);
  const [preCount, setPreCount] = useState(0);
  const [pyth, setPyth] = useState<PythFeed | null>(null);
  const [apiErr, setApiErr] = useState("");

  useEffect(() => {
    const back = consumeWalletRedirect();
    const addr = back.address || savedMobileAddress();
    if (addr) {
      setWallet(addr);
      setWalletId(savedWalletKind() === "solflare" ? "solflare" : "phantom");
    }
    if (back.signature) {
      setSig(back.signature);
      setScreen("receipt");
      const ui = readUiState<{ companyId?: string; pickedId?: string }>();
      saveUiState({
        screen: "receipt",
        companyId: ui?.companyId,
        pickedId: ui?.pickedId,
        signature: back.signature,
      });
    }
    if (back.error) setErr(back.error);
  }, []);

  useEffect(() => {
    loadCatalog()
      .then(({ list, preCount: n }) => {
        setCatalog(list);
        setPreCount(n);
        const ui = readUiState<{ screen?: Screen; companyId?: string; pickedId?: string; signature?: string }>();
        if (!ui?.companyId) return;
        const c = list.find((x) => x.id === ui.companyId);
        if (!c) return;
        setCompany(c);
        setPicked(c.wrappers.find((w) => w.id === ui.pickedId) || c.wrappers[0] || null);
        if (ui.signature) {
          setSig(ui.signature);
          setScreen("receipt");
          return;
        }
        if (ui.screen === "receipt") return;
        if (ui.screen) setScreen(ui.screen);
      })
      .catch((e) => setApiErr(e instanceof Error ? e.message : "PreStocks API failed"));
  }, []);

  useEffect(() => {
    if (!company) return setPyth(null);
    resolvePythFeed(company.id)
      .then(setPyth)
      .catch(() => setPyth(null));
  }, [company]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return catalog;
    return catalog.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.aliases.some((a) => a.includes(s) || s.includes(a)),
    );
  }, [q, catalog]);
  const found = detectWallets();
  const mobile = isMobile();

  async function pickWallet(id: WalletId) {
    setErr("");
    try {
      const pk = await connectWallet(id);
      setWallet(pk);
      setWalletId(id);
      setPicker(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Connect failed");
    }
  }

  async function onConnectClick() {
    if (wallet) {
      setPicker(true);
      return;
    }
    const list = detectWallets();
    if (list.length === 1 || (mobile && list.length >= 1)) {
      await pickWallet(list[0].id);
      return;
    }
    if (mobile && window.solana) {
      try {
        await pickWallet("phantom");
        return;
      } catch {
        /* fall through to picker */
      }
    }
    setPicker(true);
  }

  function openCompany(c: Company) {
    const next = c.wrappers.length === 1 ? c.wrappers[0] : null;
    setCompany(c);
    setPicked(next);
    setQuote(null);
    setSig("");
    setErr("");
    setScreen("company");
    saveUiState({ screen: "company", companyId: c.id, pickedId: next?.id });
  }

  async function onQuote() {
    if (!picked) return;
    setBusy("Fetching Jupiter quote…");
    setErr("");
    setQuote(null);
    try {
      const usd = Number(amount);
      if (!usd || usd <= 0) throw new Error("Enter a USDC amount");
      setQuote(await getQuote(picked.mint, usd));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Quote failed");
    } finally {
      setBusy("");
    }
  }

  async function onBuy() {
    if (!picked) return;
    setErr("");
    try {
      let pk = wallet;
      if (!pk) {
        const list = detectWallets();
        if (list.length === 0) {
          setPicker(true);
          throw new Error("Install Solflare in this Chrome, refresh, then connect.");
        }
        pk = await connectWallet(walletId || list[0].id);
        setWallet(pk);
        setWalletId(walletId || list[0].id);
      }
      setBusy("Building swap…");
      const qte = quote ?? (await getQuote(picked.mint, Number(amount)));
      setQuote(qte);
      const b64 = await getSwapTx(qte, pk);
      setBusy("Sign in your wallet…");
      const web3 = await import("@solana/web3.js");
      const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const tx = web3.VersionedTransaction.deserialize(raw);
      if (mobile && !getProvider(walletId)) {
        const { default: bs58 } = await import("bs58");
        requestPhantomSign(bs58.encode(tx.serialize()));
        return;
      }
      const provider = getProvider(walletId);
      if (!provider) throw new Error("Wallet gone. Refresh and connect again.");
      let signature = "";
      if (provider.signAndSendTransaction) {
        const sent = await provider.signAndSendTransaction(tx);
        signature = typeof sent === "string" ? sent : sent.signature;
      } else {
        const signed = (await provider.signTransaction(
          tx,
        )) as InstanceType<typeof web3.VersionedTransaction>;
        const conn = new web3.Connection(RPC, "confirmed");
        signature = await conn.sendRawTransaction(signed.serialize(), {
          skipPreflight: false,
        });
      }
      setSig(signature);
      setScreen("receipt");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Swap failed";
      setErr(
        `${msg}\n\nIf the popup never appeared, use Open mint on Jupiter — that path always works.`,
      );
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="app">
      <header className="top">
        <button className="brand" onClick={() => setScreen("home")}>
          <span className="lockup" aria-label="WRAPPER">
            <img className="mark-img" src={logoMark} alt="" />
            <span className="wordmark"><em>rapper</em></span>
          </span>
          <span className="tag">See the mint. Then buy it.</span>
        </button>
        <div className="actions">
          <button className="ghost" onClick={() => setScreen("tools")}>
            Tools
          </button>
          <button className={`ghost ${wallet ? "connected" : ""}`} onClick={onConnectClick}>
            {wallet ? `${wallet.slice(0, 4)}…${wallet.slice(-4)}` : "Connect"}
          </button>
        </div>
      </header>

      {screen === "home" && (
        <>
          <section className="hero">
            <div className="kicker">Tokenized stocks on Solana</div>
            <h1>Same company.<br />Different token.</h1>
            <p>
              Search a company. See every token that uses that name. Compare what
              each one actually is. Buy the exact token you picked — on this page.
            </p>
            <div className="steps">
              <div className="step"><b>1. Search</b>Type the company.</div>
              <div className="step"><b>2. Compare</b>See each issuer side by side.</div>
              <div className="step"><b>3. Choose</b>Tap the token you want.</div>
              <div className="step"><b>4. Buy</b>Swap USDC into that token here.</div>
              <div className="step"><b>5. Done</b>Your wallet holds that mint only.</div>
            </div>
            <div className="note">
              SpaceX has four different tokens. OpenAI and Kalshi have two.
              Apple has one. We do not invent a second token when the market only has one.
              {preCount ? ` PreStocks listed ${preCount} names.` : ""}
              {apiErr ? ` ${apiErr}` : ""}
            </div>
          </section>
          <div className="search-wrap">
            <input
              className="search"
              placeholder="Search SpaceX, OpenAI, Kalshi, Apple…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid">
            <div className="section-label">{q ? "Matches" : "Companies on WRAPPER"}</div>
            {(q ? results : catalog).map((c) => (
              <button key={c.id} className="company" onClick={() => openCompany(c)}>
                <div>
                  <h3>{c.name}</h3>
                  <div className="badges">
                    <span className={`chip ${c.wrappers.length > 1 ? "multi" : ""}`}>
                      {c.wrappers.length} wrapper{c.wrappers.length === 1 ? "" : "s"}
                    </span>
                    <span className={`chip ${c.listed ? "" : "priv"}`}>
                      {c.listed ? "Public equity" : "Private / pre-IPO"}
                    </span>
                  </div>
                </div>
                <span className="tickers">{c.wrappers.map((w) => w.ticker).join(" · ")}</span>
              </button>
            ))}
            {q && results.length === 0 && (
              <p className="issuer">No mapped company. We refuse to guess a mint from a name.</p>
            )}
          </div>
        </>
      )}

      {screen === "company" && company && (
        <div className="grid" style={{ paddingTop: 24 }}>
          <button className="back" onClick={() => setScreen("home")}>
            ← All companies
          </button>
          <h1 style={{ fontSize: 32, margin: "0 0 8px" }}>{company.name}</h1>
          <p className="issuer" style={{ marginBottom: 14 }}>
            {company.wrappers.length > 1
              ? "These tokens are not interchangeable. The chart can rhyme. The claim does not."
              : "Only one verified mint is mapped for this name. Read what you actually hold before you buy."}
          </p>
          {pyth && (
            <div className="note" style={{ marginBottom: 14 }}>
              <b>Pyth {pyth.display}</b> · {pyth.symbol} · session{" "}
              {pyth.isOpen ? "OPEN" : "CLOSED"} · feed {pyth.id.slice(0, 8)}…
              {" "}
              <a href={pythInsightsUrl(pyth.symbol)} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
                Insights
              </a>
            </div>
          )}
          {company.wrappers.length > 1 && (
            <div className="warn-banner">
              {company.wrappers.length} different products use this company name. Pick a
              card before you buy.
            </div>
          )}
          <div className="cards">
            {company.wrappers.map((w) => (
              <article
                key={w.id}
                className={`card ${picked?.id === w.id ? "selected" : ""}`}
              >
                <div className="card-top">
                  <div>
                    <h3 className="ticker">{w.ticker}</h3>
                    <div className="issuer">{w.issuer}</div>
                  </div>
                  <span className={`pill ${w.strength}`}>
                    {strengthLabel[w.strength]}
                  </span>
                </div>
                <dl className="meta">
                  <div>
                    <dt>You hold</dt>
                    <dd>{w.youHold}</dd>
                  </div>
                  <div>
                    <dt>Redeemable?</dt>
                    <dd>{w.redeemable}</dd>
                  </div>
                  <div>
                    <dt>Fee</dt>
                    <dd>{w.fee}</dd>
                  </div>
                  <div>
                    <dt>Venue</dt>
                    <dd>{w.venue}</dd>
                  </div>
                  <div>
                    <dt>Mint</dt>
                    <dd className="mint">{w.mint}</dd>
                  </div>
                </dl>
                <div className="row">
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setPicked(w);
                      if (company) saveUiState({ screen: "company", companyId: company.id, pickedId: w.id });
                      setQuote(null);
                    }}
                  >
                    {picked?.id === w.id ? "Selected for buy" : "Select this mint"}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => navigator.clipboard.writeText(w.mint)}
                  >
                    Copy mint
                  </button>
                  {w.officialUrl && (
                    <a className="btn-secondary" href={w.officialUrl} target="_blank" rel="noreferrer">
                      Official issuer
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>

          {picked && (
            <section className="buy">
              <div className="lock">Buying {picked.ticker}</div>
              <h2>{picked.ticker}</h2>
              <p>
                This swap sends your USDC and returns {picked.ticker} from {picked.issuer}.
                Token address {shortMint(picked.mint)}. This is not a share certificate
                from {company.name}.
              </p>
              <SwapDesk mint={picked.mint} ticker={picked.ticker} />
              {mobile && (
                <p>
                  On a phone, buy inside the box above. Tap Connect in that box,
                  approve in Phantom or Solflare, then swap. That box talks to the
                  wallet. The extra buttons below are for desktop Chrome only.
                </p>
              )}
              <div className="row" style={mobile ? { display: "none" } : undefined}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setQuote(null);
                  }}
                />
                <span>USDC</span>
                <button className="btn-secondary" onClick={onQuote} disabled={!!busy}>
                  Quote
                </button>
                <button className="btn-primary" onClick={onBuy} disabled={!!busy}>
                  {busy || "Buy this mint"}
                </button>
                <a
                  className="btn-secondary"
                  href={jupiterSwapUrl(picked.mint)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open mint on Jupiter
                </a>
                <a
                  className="btn-secondary"
                  href={`https://clawpump.tech/?pair=${picked.mint}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Clawpump pair
                </a>
                <a
                  className="btn-secondary"
                  href="https://docs.meteora.ag/core-products/dbc/what-is-dbc"
                  target="_blank"
                  rel="noreferrer"
                >
                  Meteora DBC
                </a>
              </div>
              {quote && (
                <div className="quote">
                  You receive about {formatOut(quote.outAmount, picked.decimals)}{" "}
                  {picked.ticker}
                  {quote.priceImpactPct
                    ? ` · impact ${Number(quote.priceImpactPct).toFixed(3)}%`
                    : ""}
                </div>
              )}
              {err && <div className="err">{err}</div>}
            </section>
          )}
        </div>
      )}

      {screen === "receipt" && picked && company && (
        <div className="grid" style={{ paddingTop: 24 }}>
          <div className="receipt">
            <p className="issuer">Trade receipt</p>
            <h1 style={{ fontSize: 28, margin: "0 0 12px" }}>
              Bought {picked.ticker}, not “{company.name}”
            </h1>
            <dl className="meta">
              <div>
                <dt>Company</dt>
                <dd>{company.name}</dd>
              </div>
              <div>
                <dt>Wrapper</dt>
                <dd>
                  {picked.ticker} · {strengthLabel[picked.strength]}
                </dd>
              </div>
              <div>
                <dt>Issuer</dt>
                <dd>{picked.issuer}</dd>
              </div>
              <div>
                <dt>Mint</dt>
                <dd className="mint">{picked.mint}</dd>
              </div>
              <div>
                <dt>Paid</dt>
                <dd>{amount} USDC</dd>
              </div>
              <div>
                <dt>Signature</dt>
                <dd className="mint">{sig}</dd>
              </div>
            </dl>
            <div className="row">
              <a
                className="btn-primary"
                href={`https://solscan.io/tx/${sig}`}
                target="_blank"
                rel="noreferrer"
              >
                View on Solscan
              </a>
              <button className="btn-secondary" onClick={() => setScreen("home")}>
                New search
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === "tools" && (
        <div className="grid" style={{ paddingTop: 24 }}>
          <button className="back" onClick={() => setScreen("home")}>
            ← Back
          </button>
          <h1 style={{ fontSize: 32, margin: "0 0 8px" }}>Stocklana sponsor tools</h1>
          <p className="issuer" style={{ marginBottom: 16 }}>
            Same app. These are the handed APIs wired for the Stocklana bounties.
          </p>
          {SPONSORS.map((s) => (
            <article key={s.id} className="card">
              <div className="card-top">
                <h3 className="ticker">{s.name}</h3>
                <span className="pill entitlement">{s.bounty}</span>
              </div>
              <p className="issuer">{s.used}</p>
              <a className="btn-secondary" href={s.href} target="_blank" rel="noreferrer">
                Open docs / API
              </a>
            </article>
          ))}
        </div>
      )}

      {picker && (
        <div className="overlay" onClick={() => setPicker(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Connect a wallet</h2>
            {mobile ? (
              <p>
                This sends a connect request to your wallet app. Approve it there.
                You come back to this page with the address connected.
              </p>
            ) : (
              <p>Pick the wallet installed in this browser.</p>
            )}
            {mobile && (
              <>
                <button className="wallet-choice" onClick={requestPhantomConnect}>
                  Connect Phantom
                </button>
                <button className="wallet-choice" onClick={requestSolflareConnect}>
                  Connect Solflare
                </button>
              </>
            )}
            {found.length === 0 && !mobile && (
              <>
                <p className="err">No wallet found in this browser.</p>
                <a className="btn-primary" href={installLink("solflare")} target="_blank" rel="noreferrer">
                  Install Solflare
                </a>
              </>
            )}
            {found.map((w) => (
              <button key={w.id} className="wallet-choice" onClick={() => pickWallet(w.id)}>
                {w.label}
              </button>
            ))}
            <div className="row">
              <button className="btn-secondary" onClick={() => setPicker(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="foot">
        WRAPPER is not a broker and not legal advice. Tokenized stocks are different
        legal products that share a name. Always read the issuer terms.
      </footer>
    </div>
  );
}
