import { USDC_MINT } from "../data/registry";

const QUOTE = "https://lite-api.jup.ag/swap/v1/quote";
const SWAP = "https://lite-api.jup.ag/swap/v1/swap";

export type Quote = {
  outAmount: string;
  inAmount: string;
  otherAmountThreshold: string;
  priceImpactPct?: string;
  raw: Record<string, unknown>;
};

export function jupiterSwapUrl(outputMint: string) {
  return `https://jup.ag/swap?sell=${USDC_MINT}&buy=${outputMint}`;
}

export async function getQuote(outputMint: string, usdcAmount: number) {
  const atoms = Math.round(usdcAmount * 1_000_000);
  const url = new URL(QUOTE);
  url.searchParams.set("inputMint", USDC_MINT);
  url.searchParams.set("outputMint", outputMint);
  url.searchParams.set("amount", String(atoms));
  url.searchParams.set("slippageBps", "75");
  url.searchParams.set("restrictIntermediateTokens", "true");
  const res = await fetch(url.toString());
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Quote failed (${res.status})`);
  }
  const raw = (await res.json()) as Record<string, unknown>;
  if (!raw.outAmount) throw new Error("No route for this mint");
  return {
    outAmount: String(raw.outAmount),
    inAmount: String(raw.inAmount),
    otherAmountThreshold: String(raw.otherAmountThreshold ?? raw.outAmount),
    priceImpactPct: raw.priceImpactPct != null ? String(raw.priceImpactPct) : undefined,
    raw,
  } satisfies Quote;
}

export async function getSwapTx(quote: Quote, userPublicKey: string) {
  const res = await fetch(SWAP, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote.raw,
      userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      dynamicSlippage: true,
      prioritizationFeeLamports: "auto",
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Swap tx failed (${res.status})`);
  }
  const json = (await res.json()) as { swapTransaction?: string };
  if (!json.swapTransaction) throw new Error("Jupiter did not return a transaction");
  return json.swapTransaction;
}

export function formatOut(atoms: string, decimals: number) {
  const n = Number(atoms) / 10 ** decimals;
  if (!Number.isFinite(n)) return "—";
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
  return n.toPrecision(4);
}
