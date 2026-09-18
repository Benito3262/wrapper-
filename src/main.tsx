import { Buffer } from "buffer";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import WrapperApp from "./WrapperApp.tsx";

const g = globalThis as unknown as { Buffer?: typeof Buffer };
if (!g.Buffer) g.Buffer = Buffer;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WrapperApp />
  </StrictMode>,
);
