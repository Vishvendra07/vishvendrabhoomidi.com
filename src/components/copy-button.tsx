"use client";
import { useState } from "react";
import { Icon } from "./icons";
export function CopyButton({ value, label = "Copy code" }: { value: string; label?: string }) {
  const [state,setState] = useState("");
  return <button className="copy-button" aria-label={state || label} onClick={async () => { try { await navigator.clipboard.writeText(value); setState("Copied"); } catch { setState("Copy unavailable"); } setTimeout(() => setState(""), 2500); }}><Icon name={state === "Copied" ? "check" : "copy"} width="16" height="16" /><span aria-live="polite">{state || label}</span></button>;
}
