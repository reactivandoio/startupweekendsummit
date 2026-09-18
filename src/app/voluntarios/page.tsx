import type { Metadata } from "next";
import { Eyebrow } from "@/components/eyebrow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
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

// Fundos sólidos dos tiles, no espírito dos retratos de palestrantes em cor chapada
const tileColors = ["bg-mint-wash", "bg-emerald-band", "bg-indigo", "bg-lavender"];

// Formas brancas chapadas por cima dos tiles, no mesmo vocabulário do mural
const tileShapes = [
  <circle key="c" cx="55" cy="45" r="28" fill="#fff" />,
  <polygon key="h" points="55,15 82,30 82,60 55,75 28,60 28,30" fill="#fff" />,
  <polygon key="v" points="25,25 55,75 85,25 70,25 55,50 40,25" fill="#fff" />,
  <rect key="r" x="30" y="20" width="45" height="45" fill="#fff" />,
];

export default function VoluntariosPage() {
  return (
    <>
      {/* Hero preto com o CTA outlined levando ao formulário */}
      <section className="bg-obsidian text-paper">
        <SiteHeader />
        <div className="mx-auto flex max-w-page flex-col gap-12 px-4 pb-20 pt-16 sm:px-6 md:pb-30 md:pt-30">
          <div className="flex flex-col gap-6">
            <Eyebrow light>Voluntariado</Eyebrow>
            <h1 className="font-display text-display">Faça parte da equipe que traz o Summit da Techstars para Goiânia.</h1>
          </div>
          <div className="flex flex-col gap-2 text-body-md">
            <p className="font-semibold">{site.date}</p>
            <p>
              {site.venue} · {site.city} · 3 dias
            </p>
          </div>
          <a
            href="#inscricao"
            className="flex h-16 w-full items-center justify-center border border-paper text-subheading transition-colors hover:bg-paper hover:text-obsidian"
          >
            Quero ser voluntário
          </a>
        </div>
      </section>

      {/* Faixa mint: condições */}
      <section className="bg-mint-wash text-ink">
        <div className="mx-auto grid max-w-page gap-12 px-4 py-15 sm:px-6 md:grid-cols-2 md:items-end">
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-heading">Inscrições abertas.</h2>
            <p className="max-w-[44ch] text-body-md">
              Preencha o formulário no fim da página. A organização responde pelo WhatsApp em poucos dias.
            </p>
          </div>
          <div className="flex flex-col gap-4 md:items-end md:text-right">
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2 L23 21 H1 Z" fill="var(--color-ink)" />
            </svg>
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
                <div className={`relative flex aspect-square items-end p-4 ${tileColors[i % tileColors.length]}`}>
                  <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
                    {tileShapes[i % tileShapes.length]}
                  </svg>
                  <span className="relative font-mono text-body tracking-[0.03em] text-ink">
                    {String(i + 1).padStart(2, "0")}
                  </span>
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
          <ul className="border-t border-ink">
            {volunteerAreas.map((a, i) => (
              <li key={a.value} className="flex items-baseline gap-6 border-b border-ash py-6">
                <span className="font-mono text-body tracking-[0.03em]">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display text-heading-sm">{a.label}</span>
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
              <li key={s.title} className="flex flex-col gap-4 border-t border-ink pt-4">
                <span className="font-mono text-body tracking-[0.03em]">{String(i + 1).padStart(2, "0")}</span>
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
              <a href={site.whatsappUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                WhatsApp {site.whatsapp}
              </a>{" "}
              ou{" "}
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
