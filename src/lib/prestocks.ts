export type PreStock = {
  name: string;
  symbol: string;
  contract_address: string;
  tokenPrice?: number;
  markPrice?: number;
  impliedValuation?: number;
  markValuation?: number;
  supply?: number;
  external_url?: string;
};

const INCIDENT: Record<string, string> = {
  OPENAI:
    "May 2026: OpenAI said some upstream SPV transfers were void/unauthorized. Token is economic exposure, not cap-table equity.",
  ANTHROPIC:
    "May 2026: Anthropic said SPV transfers were void under its transfer restrictions. Token fell sharply. Not a share.",
};

export async function fetchPreStocks(): Promise<PreStock[]> {
  const res = await fetch("https://prestocks.com/api/prestocks");
  if (!res.ok) throw new Error(`PreStocks API ${res.status}`);
  const data = (await res.json()) as PreStock[];
  return Array.isArray(data) ? data : [];
}

export function preStockIncident(symbol: string) {
  return INCIDENT[symbol.toUpperCase()];
}

export function preStockPage(name: string) {
  const slug = name.replace(/\s+PreStocks$/i, "").trim().toLowerCase();
  return `https://prestocks.com/${slug}`;
}
