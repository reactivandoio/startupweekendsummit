"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Re-renderiza a página do servidor a cada `seconds` (ex.: esperando o webhook do Pix ou do cartão confirmar).
// Só consulta com a aba visível. Para em `until` + 1 min ou depois de `maxMinutes` (o que vier antes).
export function AutoRefresh({ seconds = 5, until, maxMinutes, resume = false }: { seconds?: number; until?: string; maxMinutes?: number; resume?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      const untilAt = until ? new Date(until).getTime() + 60_000 : Infinity;
      const stopAt = Math.min(untilAt, maxMinutes ? Date.now() + maxMinutes * 60_000 : Infinity);
      timer = setInterval(() => {
        if (document.visibilityState !== "visible") return;
        router.refresh();
        if (Date.now() > stopAt && timer) {
          clearInterval(timer);
          timer = null;
        }
      }, seconds * 1000);
    };
    // resume: aba em segundo plano pausa de vez (sem timer rodando à toa); ao voltar, consulta na hora e recomeça
    const onVisible = () => {
      if (!resume) return;
      if (document.visibilityState !== "visible") {
        if (timer) clearInterval(timer);
        timer = null;
        return;
      }
      if (timer) return;
      router.refresh();
      start();
    };
    start();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, seconds, until, maxMinutes, resume]);
  return null;
}
