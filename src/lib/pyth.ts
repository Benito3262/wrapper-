export type PythFeed = {
  id: string;
  symbol: string;
  display: string;
  isOpen: boolean | null;
  nextOpen: number | null;
};

const KNOWN: Record<string, string> = {
  apple: "Equity.US.AAPL/USD",
  nvidia: "Equity.US.NVDA/USD",
  tesla: "Equity.US.TSLA/USD",
  meta: "Equity.US.META/USD",
};

export async function resolvePythFeed(companyId: string): Promise<PythFeed | null> {
  const q = KNOWN[companyId];
  if (!q) return null;
  const url = `https://hermes.pyth.network/v2/price_feeds?query=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pyth Hermes ${res.status}`);
  const rows = (await res.json()) as Array<{
    id: string;
    market_hours?: { is_open?: boolean; next_open?: number };
    attributes?: { symbol?: string; display_symbol?: string; description?: string };
  }>;
  const hit =
    rows.find((r) => r.attributes?.symbol === q) ||
    rows.find((r) => (r.attributes?.display_symbol || "").toUpperCase() === q.split(".")[2]?.split("/")[0]);
  if (!hit) return null;
  return {
    id: hit.id,
    symbol: hit.attributes?.symbol || q,
    display: hit.attributes?.display_symbol || q,
    isOpen: hit.market_hours?.is_open ?? null,
    nextOpen: hit.market_hours?.next_open ?? null,
  };
}

export function pythInsightsUrl(symbol: string) {
  return `https://insights.pyth.network/price-feeds/${encodeURIComponent(symbol)}`;
}
