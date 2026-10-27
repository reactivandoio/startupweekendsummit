import { Eyebrow } from "@/components/eyebrow";
import { Illustration } from "@/components/illustration";
import { SiteHeader } from "@/components/site-header";
import type { Illustration as IllustrationData } from "@/content/illustrations";
import { site } from "@/content/site";

/* Abertura de toda página pública: papel, título à esquerda e um monumento de Goiânia
   (ilustração do pacote da marca, na versão do tema) à direita. A home usa `size="display"`; as internas, `heading-lg`. */
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
  illustration: IllustrationData;
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
        <Illustration
          of={illustration}
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
