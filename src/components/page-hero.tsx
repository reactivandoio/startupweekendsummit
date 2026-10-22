import Image from "next/image";
import { Eyebrow } from "@/components/eyebrow";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/content/site";

export type HeroIllustration = { src: string; alt: string; width: number; height: number };

/* Abertura de toda página pública: papel branco, título à esquerda e um monumento de Goiânia
   (ilustração do pacote da marca) à direita. A home usa `size="display"`; as internas, `heading-lg`. */
export function PageHero({
  eyebrow,
  title,
  lead,
  size = "heading-lg",
  illustration,
  children,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  size?: "display" | "heading-lg";
  illustration: HeroIllustration;
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-paper text-ink">
      <SiteHeader />
      <div className="mx-auto grid max-w-page items-center gap-10 px-4 pb-15 pt-8 sm:px-6 md:grid-cols-[1.05fr_1fr] md:gap-12 md:pb-20 md:pt-14">
        <div className="relative z-10 flex min-w-0 flex-col gap-10">
          <div className="flex flex-col gap-6">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className={`font-display text-balance ${size === "display" ? "text-display" : "text-heading-lg"}`}>{title}</h1>
            {lead && <p className="max-w-[42ch] text-body-md">{lead}</p>}
          </div>
          {children}
        </div>
        <Image
          src={illustration.src}
          alt={illustration.alt}
          width={illustration.width}
          height={illustration.height}
          priority
          sizes="(min-width: 1200px) 560px, (min-width: 768px) 48vw, 100vw"
          className="relative z-0 h-auto max-h-[380px] w-full max-w-[560px] justify-self-center object-contain md:max-h-none md:justify-self-end"
        />
      </div>
    </section>
  );
}

/* Data e local do evento, com a barra Marigold: o mesmo bloco em todos os heros */
export function EventMeta() {
  return (
    <div className="flex flex-col gap-2 border-l-4 border-marigold pl-4 text-body-md">
      <p className="font-semibold">{site.date}</p>
      <p>
        {site.venue} · {site.city} · 3 dias
      </p>
    </div>
  );
}

/* Ilustrações usadas nos heros, uma por página */
export const illustrations = {
  chateaubriand: {
    src: "/ilustracoes/chateaubriand-evento.webp",
    alt: "Ilustração de pessoas reunidas em estandes de inovação ao redor do monumento de Chateaubriand, em Goiânia",
    width: 1400,
    height: 1079,
  },
  tresRacas: {
    src: "/ilustracoes/monumento-tres-racas.webp",
    alt: "Ilustração do Monumento às Três Raças, em Goiânia: três figuras erguendo juntas um bloco Marigold",
    width: 627,
    height: 720,
  },
  coreto: {
    src: "/ilustracoes/coreto-evento.webp",
    alt: "Ilustração de um evento no coreto do Lago das Rosas, em Goiânia, com pessoas conversando e apresentando",
    width: 1400,
    height: 1024,
  },
  estacao: {
    src: "/ilustracoes/estacao-evento.webp",
    alt: "Ilustração de pessoas chegando a um evento em frente à Estação Ferroviária de Goiânia",
    width: 1400,
    height: 1409,
  },
  relogio: {
    src: "/ilustracoes/relogio-goias.webp",
    alt: "Ilustração do Relógio da Avenida Goiás, em Goiânia",
    width: 654,
    height: 720,
  },
  trampolim: {
    src: "/ilustracoes/trampolim-lago-das-rosas.webp",
    alt: "Ilustração do trampolim do Lago das Rosas, em Goiânia",
    width: 466,
    height: 720,
  },
} satisfies Record<string, HeroIllustration>;
