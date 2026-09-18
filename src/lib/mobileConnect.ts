import nacl from "tweetnacl";
import bs58 from "bs58";

const SK = "wrapper_dapp_sk";
const PK = "wrapper_dapp_pk";
const THEIR = "wrapper_wallet_enc_pk";
const SESSION = "wrapper_wallet_session";
const ADDR = "wrapper_wallet_addr";
const KIND = "wrapper_wallet_kind";
const STATE = "wrapper_ui_state";

function store() {
  return window.localStorage;
}

export function savedMobileAddress() {
  try {
    return store().getItem(ADDR);
  } catch {
    return null;
  }
}

export function savedWalletKind(): "phantom" | "solflare" | null {
  const v = store().getItem(KIND);
  return v === "solflare" || v === "phantom" ? v : null;
}

export function saveUiState(state: unknown) {
  store().setItem(STATE, JSON.stringify(state));
}

export function readUiState<T>(): T | null {
  try {
    const raw = store().getItem(STATE);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function ensureKeyPair() {
  const existingSk = store().getItem(SK);
  const existingPk = store().getItem(PK);
  if (existingSk && existingPk) {
    return { publicKey: bs58.decode(existingPk), secretKey: bs58.decode(existingSk) };
  }
  const kp = nacl.box.keyPair();
  store().setItem(SK, bs58.encode(kp.secretKey));
  store().setItem(PK, bs58.encode(kp.publicKey));
  return kp;
}

function redirectBase() {
  return `${window.location.origin}${window.location.pathname}`;
}

function connectUrl(host: "phantom" | "solflare") {
  const kp = ensureKeyPair();
  const app = encodeURIComponent(window.location.origin);
  const redirect = encodeURIComponent(redirectBase());
  const pk = bs58.encode(kp.publicKey);
  const root = host === "phantom" ? "https://phantom.app/ul/v1/connect" : "https://solflare.com/ul/v1/connect";
  return (
    `${root}?app_url=${app}` +
    `&dapp_encryption_public_key=${pk}` +
    `&redirect_link=${redirect}` +
    `&cluster=mainnet-beta`
  );
}

export function requestPhantomConnect() {
  store().setItem(KIND, "phantom");
  window.location.href = connectUrl("phantom");
}

export function requestSolflareConnect() {
  store().setItem(KIND, "solflare");
  window.location.href = connectUrl("solflare");
}

function paramsFromUrl() {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const get = (k: string) => search.get(k) || hash.get(k);
  return {
    errorCode: get("errorCode") || get("errorMessage"),
    data: get("data"),
    nonce: get("nonce"),
    phantomPk:
      get("phantom_encryption_public_key") ||
      get("solflare_encryption_public_key") ||
      get("encryption_public_key"),
    publicKey: get("public_key") || get("address"),
    signature: get("signature"),
  };
}

function decryptPayload(data: string, nonce: string, theirPk: string) {
  const sk = store().getItem(SK);
  if (!sk) throw new Error("Missing local key after wallet return");
  const shared = nacl.box.before(bs58.decode(theirPk), bs58.decode(sk));
  const opened = nacl.box.open.after(bs58.decode(data), bs58.decode(nonce), shared);
  if (!opened) throw new Error("Could not read the wallet reply");
  return JSON.parse(new TextDecoder().decode(opened)) as Record<string, string>;
}

export function consumeWalletRedirect(): { address?: string; signature?: string; error?: string } {
  const p = paramsFromUrl();
  if (!p.data && !p.publicKey && !p.signature && !p.errorCode) return {};
  if (p.errorCode) {
    history.replaceState({}, "", window.location.pathname);
    return { error: p.errorCode };
  }
  if (p.publicKey && p.publicKey.length >= 32 && !p.data) {
    store().setItem(ADDR, p.publicKey);
    history.replaceState({}, "", window.location.pathname);
    return { address: p.publicKey };
  }
  if (p.signature && !p.data) {
    history.replaceState({}, "", window.location.pathname);
    return { signature: p.signature };
  }
  if (!p.data || !p.nonce || !p.phantomPk) {
    history.replaceState({}, "", window.location.pathname);
    return {};
  }
  try {
    store().setItem(THEIR, p.phantomPk);
    const parsed = decryptPayload(p.data, p.nonce, p.phantomPk);
    if (parsed.public_key) store().setItem(ADDR, parsed.public_key);
    if (parsed.session) store().setItem(SESSION, parsed.session);
    history.replaceState({}, "", window.location.pathname);
    return { address: parsed.public_key, signature: parsed.signature };
  } catch (e) {
    history.replaceState({}, "", window.location.pathname);
    return { error: e instanceof Error ? e.message : "Wallet return failed" };
  }
}

export function requestWalletSign(serializedTxB58: string) {
  const kp = ensureKeyPair();
  const their = store().getItem(THEIR);
  const session = store().getItem(SESSION);
  if (!their || !session) throw new Error("Connect the wallet again, then buy.");
  const nonce = nacl.randomBytes(24);
  const payload = JSON.stringify({
    transaction: serializedTxB58,
    session,
    sendOptions: { skipPreflight: false },
  });
  const shared = nacl.box.before(bs58.decode(their), kp.secretKey);
  const boxed = nacl.box.after(new TextEncoder().encode(payload), nonce, shared);
  const redirect = encodeURIComponent(redirectBase());
  const host =
    store().getItem(KIND) === "solflare"
      ? "https://solflare.com/ul/v1/signAndSendTransaction"
      : "https://phantom.app/ul/v1/signAndSendTransaction";
  window.location.href =
    `${host}?dapp_encryption_public_key=${bs58.encode(kp.publicKey)}` +
    `&nonce=${bs58.encode(nonce)}` +
    `&redirect_link=${redirect}` +
    `&payload=${bs58.encode(boxed)}`;
}

export const requestPhantomSign = requestWalletSign;
