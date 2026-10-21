"use client";

import { useEffect, useState } from "react";

/* Scroll spy: qual das seções (por id) está passando pela faixa central da tela (35–45% da altura).
   IntersectionObserver com rootMargin negativo: a seção "ativa" é a primeira, na ordem da lista, que cruza
   essa faixa. Regras:
   - TOP: a rolagem está acima da primeira seção (hero) → o item "Início" acende;
   - id de uma seção: ela ocupa a faixa; nos vãos entre seções o valor anterior é mantido (nada "pisca");
   - null: depois da última seção (rodapé) → nenhum item marcado.
   Fora da home (enabled=false) devolve null. */
export const TOP = "__top";

export function useActiveSection(ids: readonly string[], enabled = true): string | null {
  const [active, setActive] = useState<string | null>(TOP);
  const key = ids.join(",");
  useEffect(() => {
    if (!enabled) return;
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (els.length === 0) return;
    const visible = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting);
        const current = ids.find((id) => visible.get(id));
        if (current) return setActive(current);
        const band = window.innerHeight * 0.45;
        if (els[0].getBoundingClientRect().top > band) return setActive(TOP); // acima do conteúdo
        if (els[els.length - 1].getBoundingClientRect().bottom < band) return setActive(null); // rodapé
        // vão entre seções: mantém a anterior
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);
  return enabled ? active : null;
}
