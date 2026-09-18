import { useEffect } from "react";
import { USDC_MINT } from "../data/registry";

declare global {
  interface Window {
    Jupiter?: {
      init: (opts: Record<string, unknown>) => void;
    };
  }
}

export default function SwapDesk({ mint, ticker }: { mint: string; ticker: string }) {
  useEffect(() => {
    const el = document.getElementById("jupiter-plugin");
    if (!el) return;
    el.innerHTML = "";
    const boot = () => {
      if (!window.Jupiter) return false;
      window.Jupiter.init({
        displayMode: "integrated",
        integratedTargetId: "jupiter-plugin",
        formProps: {
          initialInputMint: USDC_MINT,
          initialOutputMint: mint,
          fixedMint: mint,
        },
        branding: {
          name: `WRAPPER · ${ticker}`,
        },
      });
      return true;
    };
    if (boot()) return;
    const t = window.setInterval(() => {
      if (boot()) window.clearInterval(t);
    }, 300);
    return () => window.clearInterval(t);
  }, [mint, ticker]);

  return (
    <div>
      <p className="issuer" style={{ marginBottom: 10 }}>
        This desk is locked to {ticker}. Jupiter cannot switch you onto another
        wrapper that happens to share the company name.
      </p>
      <div id="jupiter-plugin" style={{ minHeight: 420, borderRadius: 12, overflow: "hidden" }} />
    </div>
  );
}
