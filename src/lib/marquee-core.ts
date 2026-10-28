// Geometria do carrossel de patrocinadores (faixa degradê). Puro, sem DOM, pra ser testável com node --test.

/** Velocidade do rolamento, em px/s: lenta o bastante pra ler um logo, rápida o bastante pra parecer viva. */
export const MARQUEE_SPEED = 50;

/**
 * Quantas cópias da lista são necessárias e quanto dura um ciclo.
 * A animação desloca a faixa em exatamente uma cópia; pra nunca aparecer buraco, as cópias restantes
 * precisam cobrir a janela: (copies - 1) * copyWidth >= viewportWidth. Mínimo de duas (a cópia que
 * sai e a que entra). A duração é largura / velocidade, então a velocidade não muda com o número de logos.
 * Sem medida válida (antes de hidratar), devolve duas cópias e duração nula (o CSS tem um fallback).
 */
export function marqueeLayout(copyWidth: number, viewportWidth: number, speed = MARQUEE_SPEED): { copies: number; duration: number | null } {
  if (!(copyWidth > 0)) return { copies: 2, duration: null };
  const copies = Math.max(2, Math.ceil(viewportWidth / copyWidth) + 1);
  return { copies, duration: copyWidth / speed };
}
