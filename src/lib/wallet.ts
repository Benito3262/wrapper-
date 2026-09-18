export type SolanaProvider = {
  isPhantom?: boolean;
  isSolflare?: boolean;
  isBackpack?: boolean;
  publicKey?: { toString(): string } | string | null;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<
    | { publicKey?: { toString(): string } | string }
    | void
  >;
  disconnect?: () => Promise<void>;
  signTransaction: (tx: unknown) => Promise<unknown>;
  signAndSendTransaction?: (
    tx: unknown,
  ) => Promise<{ signature: string } | string>;
};

export type WalletId = "solflare" | "backpack" | "phantom";

declare global {
  interface Window {
    solana?: SolanaProvider;
    phantom?: { solana?: SolanaProvider };
    solflare?: SolanaProvider;
    backpack?: SolanaProvider;
  }
}

export function detectWallets(): { id: WalletId; label: string }[] {
  const found: { id: WalletId; label: string }[] = [];
  if (window.solflare || (window.solana as SolanaProvider | undefined)?.isSolflare)
    found.push({ id: "solflare", label: "Solflare" });
  if (window.backpack) found.push({ id: "backpack", label: "Backpack" });
  if (window.phantom?.solana || (window.solana as SolanaProvider | undefined)?.isPhantom)
    found.push({ id: "phantom", label: "Phantom" });
  return found;
}

export function getProvider(id?: WalletId): SolanaProvider | null {
  if (id === "solflare") return window.solflare || window.solana || null;
  if (id === "backpack") return window.backpack || null;
  if (id === "phantom") return window.phantom?.solana || window.solana || null;
  return (
    window.solflare ||
    window.backpack ||
    window.phantom?.solana ||
    window.solana ||
    null
  );
}

function pkToString(pk: unknown): string | null {
  if (!pk) return null;
  if (typeof pk === "string") return pk;
  if (typeof pk === "object" && pk && "toString" in pk) {
    return String((pk as { toString(): string }).toString());
  }
  return null;
}

export async function connectWallet(id?: WalletId) {
  const p = getProvider(id);
  if (!p) {
    throw new Error(
      "No Solana wallet in this Chrome. Install Solflare, then refresh this page.",
    );
  }
  const r = await p.connect();
  const fromResult = pkToString(
    r && typeof r === "object" ? (r as { publicKey?: unknown }).publicKey : null,
  );
  const fromProvider = pkToString(p.publicKey);
  const pk = fromResult || fromProvider;
  if (!pk) throw new Error("Wallet opened but did not return an address. Approve the connect popup.");
  return pk;
}

export function installLink(id: WalletId) {
  if (id === "backpack") return "https://backpack.app";
  if (id === "phantom") return "https://phantom.com/download";
  return "https://solflare.com";
}

export function isMobile() {
  return typeof navigator !== "undefined" && /iPhone|iPad|Android/i.test(navigator.userAgent);
}

/** Open this site inside the wallet’s in-app browser so Connect can actually work on a phone. */
export function openInWallet(id: "phantom" | "solflare") {
  const here = encodeURIComponent(window.location.href);
  const url =
    id === "phantom"
      ? `https://phantom.app/ul/browse/${here}`
      : `https://solflare.com/ul/v1/browse/${here}`;
  window.location.href = url;
}
