"use client";

import { useState } from "react";

// Copia texto pro clipboard com feedback curto; sem clipboard (http, permissão) cai no prompt do navegador
export function CopyButton({ text, label = "Copiar link", className = "" }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copie o link:", text);
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className={`border border-ash px-3 py-2 text-caption transition-colors hover:border-ink dark:border-graphite dark:hover:border-paper ${className}`}
    >
      {copied ? "Copiado" : label}
    </button>
  );
}
