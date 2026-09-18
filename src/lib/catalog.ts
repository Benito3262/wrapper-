import {
  cloneCompanies,
  type Company,
  type Wrapper,
} from "../data/registry";
import {
  fetchPreStocks,
  preStockIncident,
  preStockPage,
  type PreStock,
} from "./prestocks";

function slug(name: string) {
  return name.replace(/\s+PreStocks$/i, "").trim().toLowerCase();
}

function wrapperFromPre(p: PreStock): Wrapper {
  return {
    id: `pre-${p.symbol.toLowerCase()}`,
    issuer: "PreStocks",
    ticker: p.symbol,
    mint: p.contract_address,
    decimals: 6,
    strength: "spv",
    youHold:
      "SPV economic exposure. Not a shareholder line. Claim runs through PreStocks SPVs.",
    redeemable: "Mint/redeem on PreStocks for eligible users (their KYC).",
    fee: "Network + DEX. Official mint/redeem is on prestocks.com.",
    venue: "Jupiter / PreStocks",
    incident: preStockIncident(p.symbol),
    officialUrl: preStockPage(p.name),
    verified: true,
  };
}

export async function loadCatalog(): Promise<{ list: Company[]; preCount: number }> {
  const list = cloneCompanies();
  const pres = await fetchPreStocks();
  for (const p of pres) {
    const key = slug(p.name);
    let company = list.find(
      (c) => c.id === key || c.name.toLowerCase() === key || c.aliases.includes(key),
    );
    const w = wrapperFromPre(p);
    if (!company) {
      company = {
        id: key.replace(/\s+/g, ""),
        name: p.name.replace(/\s+PreStocks$/i, "").trim(),
        aliases: [key, p.symbol.toLowerCase()],
        listed: false,
        wrappers: [w],
      };
      list.push(company);
    } else if (!company.wrappers.some((x) => x.mint === w.mint)) {
      company.wrappers.push(w);
    }
  }
  list.sort((a, b) => b.wrappers.length - a.wrappers.length || a.name.localeCompare(b.name));
  return { list, preCount: pres.length };
}
