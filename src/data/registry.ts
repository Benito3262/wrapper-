export type Strength = "entitlement" | "tracker" | "spv" | "loan" | "unverified";

export type Wrapper = {
  id: string;
  issuer: string;
  ticker: string;
  mint: string;
  decimals: number;
  strength: Strength;
  youHold: string;
  redeemable: string;
  fee: string;
  venue: string;
  incident?: string;
  pythId?: string;
  officialUrl?: string;
  verified: boolean;
};

export type Company = {
  id: string;
  name: string;
  aliases: string[];
  listed: boolean;
  wrappers: Wrapper[];
};

export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export const companies: Company[] = [
  {
    id: "spacex",
    name: "SpaceX",
    aliases: ["spacex", "spcx", "spcxx", "tspacex", "space x"],
    listed: true,
    wrappers: [
      {
        id: "spcx-backpack",
        issuer: "Backpack Securities / Sunrise",
        ticker: "SPCX",
        mint: "SPCXxcqXj6e5dJDVNovHN8744zkbhM2bYudU45BimGb",
        decimals: 8,
        strength: "entitlement",
        youHold:
          "Tokenized securities entitlement. Closest to a real share for eligible holders.",
        redeemable:
          "Yes, for eligible users — into a brokerage entitlement via ACATS/DTCC.",
        fee: "Network + DEX only",
        venue: "Jupiter / Raydium / Backpack",
        verified: true,
      },
      {
        id: "spcxx-xstocks",
        issuer: "xStocks (Backed Assets JE)",
        ticker: "SPCXx",
        mint: "Xs3oZwbHvqis4NYcf4YKWmEia2eC84wSiVrcYcTqpH8",
        decimals: 8,
        strength: "tracker",
        youHold:
          "Tracker certificate. Price exposure. Claim is on the issuer, not a shareholder line.",
        redeemable: "Cash / product terms — not a DTCC share transfer.",
        fee: "Network + DEX only",
        venue: "Jupiter / Raydium / Kraken xStocks",
        verified: true,
      },
      {
        id: "tspacex-tessera",
        issuer: "Tessera",
        ticker: "tSpaceX",
        mint: "TSPXcLV76s6V2zDiZQ18kBfcbnjaE2ZzNT3ga2Pd99v",
        decimals: 9,
        strength: "loan",
        youHold:
          "T-Token: loan participation tied to SpaceX economic exposure. Not equity.",
        redeemable: "No share redemption. Trade or hold the token.",
        fee: "0.2% Token-2022 transfer fee",
        venue: "Meteora / Jupiter",
        officialUrl: "https://app.tessera.pe",
        verified: true,
      },
      {
        id: "spacex-pre",
        issuer: "PreStocks",
        ticker: "SPACEX",
        mint: "PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh",
        decimals: 6,
        strength: "spv",
        youHold:
          "SPV slice. You are not on SpaceX’s register. The claim is through PreStocks vehicles.",
        redeemable: "Only via PreStocks mint/redeem, and only if you pass their checks.",
        fee: "DEX plus whatever PreStocks charges on official mint/redeem.",
        venue: "Jupiter / PreStocks",
        officialUrl: "https://prestocks.com/spacex",
        verified: true,
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    aliases: ["openai", "open ai", "topenai"],
    listed: false,
    wrappers: [
      {
        id: "topenai-tessera",
        issuer: "Tessera",
        ticker: "tOpenAI",
        mint: "oPAiAikWTaFj9RYoRFD35ccfwhnMcB3ThgBZRHSkjTZ",
        decimals: 9,
        strength: "loan",
        youHold:
          "T-Token loan participation linked to OpenAI private valuation. Not a share.",
        redeemable: "No. Not cap-table equity.",
        fee: "0.2% Token-2022 transfer fee",
        venue: "Meteora / Jupiter",
        officialUrl: "https://app.tessera.pe",
        verified: true,
      },
      {
        id: "openai-pre",
        issuer: "PreStocks",
        ticker: "OPENAI",
        mint: "PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF",
        decimals: 6,
        strength: "spv",
        youHold:
          "SPV exposure to OpenAI. Not a cap-table share. No vote. No information rights.",
        redeemable: "PreStocks desk only, if they still honour mint/redeem.",
        fee: "DEX plus issuer mint/redeem fees.",
        venue: "Jupiter / PreStocks",
        incident:
          "May 2026: OpenAI said some upstream SPV transfers were void. The token is not stock.",
        officialUrl: "https://prestocks.com/openai",
        verified: true,
      },
    ],
  },
  {
    id: "kalshi",
    name: "Kalshi",
    aliases: ["kalshi", "tkalshi"],
    listed: false,
    wrappers: [
      {
        id: "tkalshi-tessera",
        issuer: "Tessera",
        ticker: "tKalshi",
        mint: "TKLSidmLVt3cqGaaodG8tyRzoANfQwoh67AccjmubeZ",
        decimals: 9,
        strength: "loan",
        youHold:
          "T-Token loan participation linked to Kalshi. Not an equity share.",
        redeemable: "No share redemption.",
        fee: "0.2% Token-2022 transfer fee",
        venue: "Meteora / Jupiter",
        officialUrl: "https://app.tessera.pe",
        verified: true,
      },
      {
        id: "kalshi-pre",
        issuer: "PreStocks",
        ticker: "KALSHI",
        mint: "PreLWGkkeqG1s4HEfFZSy9moCrJ7btsHuUtfcCeoRua",
        decimals: 6,
        strength: "spv",
        youHold: "SPV exposure to Kalshi. Not a founder share and not a seat on the exchange.",
        redeemable: "PreStocks mint/redeem if you qualify.",
        fee: "DEX plus issuer fees.",
        venue: "Jupiter / PreStocks",
        officialUrl: "https://prestocks.com/kalshi",
        verified: true,
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    aliases: ["anthropic", "claude"],
    listed: false,
    wrappers: [
      {
        id: "anthropic-pre",
        issuer: "PreStocks",
        ticker: "ANTHROPIC",
        mint: "Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw",
        decimals: 6,
        strength: "spv",
        youHold: "SPV exposure. Anthropic itself is not the issuer.",
        redeemable: "PreStocks only.",
        fee: "DEX plus issuer fees.",
        venue: "Jupiter / PreStocks",
        incident:
          "May 2026: Anthropic said transfers into the SPV were void under its restrictions. Price dropped hard.",
        officialUrl: "https://prestocks.com/anthropic",
        verified: true,
      },
    ],
  },
  {
    id: "apple",
    name: "Apple",
    aliases: ["apple", "aapl", "aaplx"],
    listed: true,
    wrappers: [
      {
        id: "aaplx",
        issuer: "xStocks (Backed Assets JE)",
        ticker: "AAPLx",
        mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
        decimals: 8,
        strength: "tracker",
        youHold:
          "Tracker certificate 1:1 collateralized by Apple shares in custody. Not a vote.",
        redeemable: "Cash value under issuer terms. Not a brokerage ACATS transfer.",
        fee: "Network + DEX only",
        venue: "Jupiter / Solflare / Kraken",
        pythId: "Equity.US.AAPL/USD",
        verified: true,
      },
    ],
  },
  {
    id: "nvidia",
    name: "NVIDIA",
    aliases: ["nvidia", "nvda", "nvdax"],
    listed: true,
    wrappers: [
      {
        id: "nvdax",
        issuer: "xStocks (Backed Assets JE)",
        ticker: "NVDAx",
        mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
        decimals: 8,
        strength: "tracker",
        youHold:
          "Tracker certificate. Economic exposure to NVDA, claim on the issuer.",
        redeemable: "Cash value under issuer terms.",
        fee: "Network + DEX only",
        venue: "Jupiter / Raydium",
        pythId: "Equity.US.NVDA/USD",
        verified: true,
      },
    ],
  },
  {
    id: "tesla",
    name: "Tesla",
    aliases: ["tesla", "tsla", "tslax"],
    listed: true,
    wrappers: [
      {
        id: "tslax",
        issuer: "xStocks (Backed Assets JE)",
        ticker: "TSLAx",
        mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
        decimals: 8,
        strength: "tracker",
        youHold:
          "Tracker certificate. Price tracks TSLA. You are not on Tesla’s register.",
        redeemable: "Cash value under issuer terms.",
        fee: "Network + DEX only",
        venue: "Jupiter / Raydium",
        pythId: "Equity.US.TSLA/USD",
        verified: true,
      },
    ],
  },
  {
    id: "meta",
    name: "Meta",
    aliases: ["meta", "facebook", "metax"],
    listed: true,
    wrappers: [
      {
        id: "metax",
        issuer: "xStocks (Backed Assets JE)",
        ticker: "METAx",
        mint: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu",
        decimals: 8,
        strength: "tracker",
        youHold: "Tracker certificate on Meta. No shareholder rights.",
        redeemable: "Cash value under issuer terms.",
        fee: "Network + DEX only",
        venue: "Jupiter / Raydium",
        pythId: "Equity.US.META/USD",
        verified: true,
      },
    ],
  },
  {
    id: "amazon",
    name: "Amazon",
    aliases: ["amazon", "amzn", "amznx"],
    listed: true,
    wrappers: [
      {
        id: "amznx",
        issuer: "xStocks (Backed Assets JE)",
        ticker: "AMZNx",
        mint: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg",
        decimals: 8,
        strength: "tracker",
        youHold: "Tracker certificate on Amazon. No shareholder standing.",
        redeemable: "Cash value under issuer terms.",
        fee: "Network + DEX only",
        venue: "Jupiter / Raydium",
        verified: true,
      },
    ],
  },
  {
    id: "alphabet",
    name: "Alphabet",
    aliases: ["alphabet", "google", "googl", "googlx"],
    listed: true,
    wrappers: [
      {
        id: "googlx",
        issuer: "xStocks (Backed Assets JE)",
        ticker: "GOOGLx",
        mint: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN",
        decimals: 8,
        strength: "tracker",
        youHold: "Tracker certificate on Alphabet. Not a Google share certificate.",
        redeemable: "Cash value under issuer terms.",
        fee: "Network + DEX only",
        venue: "Jupiter / Raydium",
        verified: true,
      },
    ],
  },
  {
    id: "microsoft",
    name: "Microsoft",
    aliases: ["microsoft", "msft", "msftx"],
    listed: true,
    wrappers: [
      {
        id: "msftx",
        issuer: "xStocks (Backed Assets JE)",
        ticker: "MSFTx",
        mint: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX",
        decimals: 8,
        strength: "tracker",
        youHold: "Tracker certificate on Microsoft.",
        redeemable: "Cash value under issuer terms.",
        fee: "Network + DEX only",
        venue: "Jupiter / Raydium",
        verified: true,
      },
    ],
  },
  {
    id: "coinbase",
    name: "Coinbase",
    aliases: ["coinbase", "coin", "coinx"],
    listed: true,
    wrappers: [
      {
        id: "coinx",
        issuer: "xStocks (Backed Assets JE)",
        ticker: "COINx",
        mint: "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu",
        decimals: 8,
        strength: "tracker",
        youHold: "Tracker certificate on Coinbase.",
        redeemable: "Cash value under issuer terms.",
        fee: "Network + DEX only",
        venue: "Jupiter / Raydium",
        verified: true,
      },
    ],
  },
];

export function searchCompanies(q: string): Company[] {
  const s = q.trim().toLowerCase();
  if (!s) return companies;
  return companies.filter(
    (c) =>
      c.name.toLowerCase().includes(s) ||
      c.aliases.some((a) => a.includes(s) || s.includes(a)),
  );
}

export function shortMint(mint: string) {
  return `${mint.slice(0, 4)}…${mint.slice(-4)}`;
}

export function cloneCompanies(): Company[] {
  return companies.map((c) => ({ ...c, wrappers: c.wrappers.map((w) => ({ ...w })) }));
}

export const strengthLabel: Record<Strength, string> = {
  entitlement: "Share entitlement",
  tracker: "Tracker certificate",
  spv: "SPV exposure",
  loan: "Loan participation",
  unverified: "Unverified mint",
};
