import type { Metadata } from "next";
import Image from "next/image";
import { buttonClass } from "@/components/button";
import { Eyebrow } from "@/components/eyebrow";
import { EventMeta, PageHero, illustrations } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { VolunteerForm } from "@/components/volunteer-form";
import { benefits, site, steps, volunteerAreas } from "@/content/site";

const title = `Seja voluntário | ${site.name}`;

export const metadata: Metadata = {
  title: "Seja voluntário",
  description: site.seoDescriptionVolunteers,
  keywords: [
    "voluntário Startup Weekend Summit",
    "voluntariado evento Goiânia 2026",
    "voluntário Techstars Goiânia",
    "trabalho voluntário evento de startups",
    ...site.keywords,
  ],
  alternates: { canonical: "/voluntarios" },
  openGraph: { url: "/voluntarios", title, description: site.seoDescriptionVolunteers },
  twitter: { card: "summary_large_image", title, description: site.seoDescriptionVolunteers },
};

// Um monumento de Goiânia por benefício, sobre os tons claros da paleta (as ilustrações têm fundo branco)
const tiles = [
  { src: "/ilustracoes/monumento-85.webp" },
  { src: "/ilustracoes/teatro-goiania.webp" },
  { src: "/ilustracoes/trampolim-lago-das-rosas.webp" },
  { src: "/ilustracoes/relogio-goias.webp" },
];

export default function VoluntariosPage() {
  return (
    <>
      {/* Hero em papel: evento no coreto do Lago das Rosas */}
      <PageHero
        eyebrow="Voluntariado"
        title="Faça parte da equipe que traz o Summit para Goiânia."
        lead="Em Goiânia, a gente faz junto. Recepção, logística, comunicação, fotografia e experiências: tem lugar pra você."
        illustration={illustrations.coreto}
      >
        <EventMeta />
        <a href="#inscricao" className={buttonClass("primary", "lg", "self-stretch sm:self-start")}>
          Quero ser voluntário
        </a>
      </PageHero>

      {/* Faixa Marigold: condições */}
      <section className="bg-marigold-wash text-ink">
        <div className="mx-auto grid max-w-page gap-12 px-4 py-15 sm:px-6 md:grid-cols-2 md:items-end">
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-heading">Inscrições abertas.</h2>
            <p className="max-w-[44ch] text-body-md">
              Preencha o formulário no fim da página. A organização responde pelo WhatsApp em poucos dias.
            </p>
          </div>
          <div className="flex flex-col gap-4 md:items-end md:text-right">
            <span aria-hidden="true" className="block h-2 w-10 bg-grass" />
            <p className="text-body-md font-semibold">Vagas limitadas por área</p>
            <p className="text-body">Maiores de 18 anos. Alimentação, camiseta e certificado inclusos.</p>
          </div>
        </div>
      </section>

      <main className="flex flex-col gap-30 bg-paper py-30">
        {/* Por que ser voluntário */}
        <section className="mx-auto flex w-full max-w-page flex-col gap-15 px-4 sm:px-6">
          <div className="grid gap-12 md:grid-cols-2">
            <div className="flex flex-col gap-6">
              <Eyebrow>Por que</Eyebrow>
              <h2 className="font-display text-heading">O que você leva do Summit</h2>
            </div>
            <div className="flex flex-col gap-4 text-body-md md:pt-10">
              <p>
                Os voluntários são a engrenagem invisível: recebem participantes, cuidam da logística, registram os
                momentos e garantem que tudo funcione. Em troca, vivem por dentro o encontro nacional das lideranças
                que organizam Startup Weekends pelo país.
              </p>
            </div>
          </div>
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b, i) => (
              <li key={b.title} className="flex flex-col gap-6">
                <div className={`relative aspect-square ${i % 2 ? "bg-grass-wash" : "bg-marigold-wash"}`}>
                  <Image
                    src={tiles[i % tiles.length].src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"
                    className="object-contain p-6 mix-blend-multiply"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-body-md font-semibold">{b.title}</h3>
                  <p className="text-body">{b.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Áreas */}
        <section id="areas" className="mx-auto flex w-full max-w-page scroll-mt-8 flex-col gap-15 px-4 sm:px-6">
          <div className="flex flex-col gap-6">
            <Eyebrow>Áreas</Eyebrow>
            <h2 className="font-display text-heading">Onde você pode ajudar</h2>
            <p className="max-w-[52ch] text-body-md">
              Escolha a área que combina com você. Se não souber, marque &ldquo;onde precisar&rdquo; e a gente
              encontra o melhor lugar.
            </p>
          </div>
          <ul className="grid gap-x-6 md:grid-cols-2">
            {volunteerAreas.map((a) => (
              <li key={a.value} className="border-b border-ash py-5 font-display text-subheading first:border-t first:border-t-ink md:nth-2:border-t md:nth-2:border-t-ink">
                {a.label}
              </li>
            ))}
          </ul>
        </section>

        {/* Como funciona */}
        <section className="mx-auto flex w-full max-w-page flex-col gap-15 px-4 sm:px-6">
          <div className="flex flex-col gap-6">
            <Eyebrow>Processo</Eyebrow>
            <h2 className="font-display text-heading">Como funciona</h2>
          </div>
          <ol className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-4 border-t-4 border-grass pt-4">
                <span className="font-display text-heading-sm text-grass-deep">{i + 1}</span>
                <h3 className="text-body-md font-semibold">{s.title}</h3>
                <p className="text-body">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Inscrição */}
        <section id="inscricao" className="mx-auto grid w-full max-w-page scroll-mt-8 gap-15 px-4 sm:px-6 md:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-6">
            <Eyebrow>Inscreva-se</Eyebrow>
            <h2 className="font-display text-heading">Inscreva-se como voluntário</h2>
            <p className="max-w-[40ch] text-body-md">
              Leva menos de 2 minutos. A organização entra em contato pelo WhatsApp com os próximos passos.
            </p>
            <p className="text-body">
              Dúvidas:{" "}
              <a href={`mailto:${site.contactEmail}`} className="underline underline-offset-4">
                {site.contactEmail}
              </a>
            </p>
          </div>
          <VolunteerForm />
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
