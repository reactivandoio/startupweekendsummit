"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Re-renderiza a página do servidor a cada `seconds` (ex.: esperando o webhook do Pix confirmar)
export function AutoRefresh({ seconds = 5, until }: { seconds?: number; until?: string }) {
  const router = useRouter();
  useEffect(() => {
    const stopAt = until ? new Date(until).getTime() + 60_000 : Infinity;
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      router.refresh();
      if (Date.now() > stopAt) clearInterval(timer);
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds, until]);
  return null;
}
