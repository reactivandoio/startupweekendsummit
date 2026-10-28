"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { marqueeLayout } from "@/lib/marquee-core";

export type MarqueeLogo = { id: string; src: string; alt: string; url: string };

/* Patrocinadores correndo na faixa Grass → Marigold, em loop sem emenda.
   A lista é repetida (duas cópias no HTML do servidor; mais, se uma cópia não cobre a janela) e a faixa
   desliza exatamente uma cópia por ciclo, então o fim de uma encosta no começo da outra sem salto.
   A duração é recalculada a partir da largura medida (velocidade constante em px/s, qualquer que seja
   o número de logos); antes de hidratar vale o fallback por quantidade, no CSS.
   Só a primeira cópia é lida e focável; as demais são decoração (aria-hidden, tabIndex -1).
   Pausa no hover/foco e vira lista estática rolável com prefers-reduced-motion (globals.css). */
export function SponsorMarquee({ logos }: { logos: MarqueeLogo[] }) {
  const stripRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLUListElement>(null);
  const [copies, setCopies] = useState(2);
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    const strip = stripRef.current;
    const first = firstRef.current;
    if (!strip || !first || typeof ResizeObserver === "undefined") return;
    // Observa a cópia (cresce conforme os logos carregam) e a faixa (muda com a janela)
    const measure = () => {
      const layout = marqueeLayout(first.getBoundingClientRect().width, strip.clientWidth);
      setCopies(layout.copies);
      setDuration(layout.duration);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(first);
    ro.observe(strip);
    return () => ro.disconnect();
  }, []);

  const style = {
    "--marquee-copies": copies,
    "--marquee-items": logos.length,
    ...(duration ? { "--marquee-duration": `${duration.toFixed(2)}s` } : {}),
  } as CSSProperties;

  return (
    <div ref={stripRef} className="sponsor-marquee w-full overflow-hidden bg-linear-to-r from-grass to-marigold py-5 md:py-6">
      <div className="sponsor-marquee-track flex w-max" style={style}>
        {Array.from({ length: copies }, (_, copy) => (
          <ul
            key={copy}
            ref={copy === 0 ? firstRef : undefined}
            aria-label={copy === 0 ? "Patrocinadores" : undefined}
            aria-hidden={copy > 0 || undefined}
            className="flex shrink-0 items-center gap-10 pr-10 md:gap-14 md:pr-14"
          >
            {logos.map((logo) => (
              <li key={logo.id} className="flex shrink-0 items-center">
                <Logo logo={logo} focusable={copy === 0} />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/* Mesma altura pra todos, largura proporcional (independe da cota). Sempre em preto: branco não passa
   AA no lado Marigold, por isso não acompanha o tema como os logos da seção de patrocinadores. */
function Logo({ logo, focusable }: { logo: MarqueeLogo; focusable: boolean }) {
  const img = (
    <Image
      src={logo.src}
      alt={logo.alt}
      width={160}
      height={40}
      unoptimized
      loading="eager"
      className="logo-mono-obsidian h-9 w-auto max-w-[70vw] object-contain md:h-11"
    />
  );
  if (!logo.url) return img;
  return (
    <a
      href={logo.url}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={focusable ? undefined : -1}
      className="block transition-opacity hover:opacity-70 focus-visible:opacity-70"
    >
      {img}
    </a>
  );
}
