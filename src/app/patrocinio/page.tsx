import type { Metadata } from "next";
import { ButtonAnchor, buttonClass } from "@/components/button";
import { Eyebrow } from "@/components/eyebrow";
import { EventMeta, PageHero, illustrations } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SponsorsSection } from "@/components/sponsors-section";
import { commercialContacts, site, sponsorship, stats } from "@/content/site";

const title = `Patrocínio | ${site.name}`;

export const metadata: Metadata = {
  title: "Patrocínio",
  description: site.seoDescriptionSponsors,
  keywords: [
    "patrocínio Startup Weekend Summit",
    "patrocinar evento de inovação Goiânia",
    "cotas de patrocínio evento startups",
    "parceria Techstars Goiânia",
    ...site.keywords,
  ],
  alternates: { canonical: "/patrocinio" },
  openGraph: { url: "/patrocinio", title, description: site.seoDescriptionSponsors },
  twitter: { card: "summary_large_image", title, description: site.seoDescriptionSponsors },
};

const commercial = commercialContacts[0];

// Fundos chapados dos cards de cota, do mais forte ao mais leve: tinta, Marigold, Grass e os dois tons claros
const tierColors = ["bg-ink text-paper", "bg-marigold", "bg-grass", "bg-grass-wash", "bg-marigold-wash"];

const reasons = [
  {
    title: "Reconhecimento nacional",
    text: "Sua marca diante das pessoas mais bem conectadas do ecossistema de startups do Brasil — lideranças de 16 estados.",
  },
  {
    title: "Comunidades de startups",
    text: "Apoie o desenvolvimento das comunidades que formam a próxima geração de líderes e empreendedores mais sofisticados.",
  },
  {
    title: "Conexão estratégica",
    text: "Momentos exclusivos de interação em que cidade, parceiros e patrocinadores se conectam com quem constrói o ecossistema.",
  },
  {
    title: "Legado para Goiânia",
    text: "Sessão exclusiva de desenvolvimento de ecossistema, liderada pela Techstars, com entrega estratégica para a cidade.",
  },
];

function Mark({ v }: { v: boolean | string }) {
  if (v === false) return <span className="text-ash">—</span>;
  if (v === true) return <span aria-label="incluso">▲</span>;
  return <span className="font-semibold">{v}</span>;
}

export default function PatrocinioPage() {
  return (
    <>
      {/* Hero em papel: o Monumento às Três Raças (três figuras erguendo o bloco juntas) */}
      <PageHero
        eyebrow="Patrocínio"
        title="Seja visto como apoiador do ecossistema empreendedor."
        lead="Ninguém constrói sozinho. Promova as comunidades de startups e respalde a geração de líderes que vai comandar o rumo do empreendedorismo no país."
        illustration={illustrations.tresRacas}
      >
        <EventMeta />
        <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap">
          <a href="#cotas" className={buttonClass("primary", "lg")}>
            Ver cotas de patrocínio
          </a>
          <a href="#contato" className={buttonClass("secondary", "lg")}>
            Falar com o comercial
          </a>
        </div>
      </PageHero>

      {/* Faixa Grass: números da última edição */}
      <section className="bg-grass text-ink">
        <div className="mx-auto flex max-w-page flex-col gap-12 px-4 py-15 sm:px-6">
          <div className="flex flex-col gap-6">
            <Eyebrow>Alcance</Eyebrow>
            <p className="max-w-[22ch] font-display text-heading-lg">A edição de 2025 reuniu 86 lideranças e 30 patrocinadores.</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-ink pt-6 lg:grid-cols-4">
            {stats.map((st) => (
              <div key={st.label} className="flex flex-col gap-2">
                <dd className="font-display text-heading">{st.value}</dd>
                <dt className="text-body">{st.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <main className="flex flex-col gap-30 bg-paper py-30">
        <SponsorsSection />

        {/* Por que patrocinar */}
        <section className="mx-auto flex w-full max-w-page flex-col gap-15 px-4 sm:px-6">
          <div className="flex flex-col gap-6">
            <Eyebrow>Por que patrocinar</Eyebrow>
            <h2 className="font-display text-heading">O que sua marca ganha</h2>
          </div>
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((r) => (
              <li key={r.title} className="flex flex-col gap-4 border-t-4 border-grass pt-4">
                <h3 className="text-body-md font-semibold">{r.title}</h3>
                <p className="text-body">{r.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Cotas */}
        <section id="cotas" className="mx-auto flex w-full max-w-page scroll-mt-8 flex-col gap-15 px-4 sm:px-6">
          <div className="flex flex-col gap-6">
            <Eyebrow>Cotas</Eyebrow>
            <h2 className="font-display text-heading">Cinco cotas de patrocínio</h2>
            <p className="max-w-[52ch] text-body-md">
              Da cota Master, que dá nome ao evento, à cota Startup, pensada para empresas em estágio inicial. Valores
              e contrapartidas conforme o deck oficial.
            </p>
          </div>

          {/* Cards de cota */}
          <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
            {sponsorship.tiers.map((t, i) => (
              <li key={t.id} className={`flex aspect-square flex-col justify-between border-2 border-ink p-5 shadow-hard ${tierColors[i]}`}>
                <h3 className="font-display text-subheading">{t.name}</h3>
                <div className="flex flex-col gap-1">
                  <p className="font-display text-heading-sm">{t.price}</p>
                  {t.note && <p className="text-body">{t.note}</p>}
                </div>
              </li>
            ))}
          </ul>

          {/* Tabela de contrapartidas */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-body">
              <thead>
                <tr className="border-b border-ink">
                  <th scope="col" className="py-4 pr-4 text-left text-caption font-semibold uppercase tracking-[0.03em]">
                    Contrapartida
                  </th>
                  {sponsorship.tiers.map((t) => (
                    <th key={t.id} scope="col" className="w-[110px] px-2 py-4 text-center align-bottom">
                      <span className="block text-caption font-semibold uppercase tracking-[0.03em]">{t.name}</span>
                      <span className="block text-caption">{t.price}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              {sponsorship.categories.map((cat) => (
                <tbody key={cat.name}>
                  <tr>
                    <th
                      scope="rowgroup"
                      colSpan={sponsorship.tiers.length + 1}
                      className="border-b border-ink pb-2 pt-8 text-left font-display text-subheading"
                    >
                      {cat.name}
                    </th>
                  </tr>
                  {cat.items.map(([label, vals]) => (
                    <tr key={label} className="border-b border-ash">
                      <th scope="row" className="py-3 pr-4 text-left font-normal">
                        {label}
                      </th>
                      {vals.map((v, i) => (
                        <td key={sponsorship.tiers[i].id} className="px-2 py-3 text-center">
                          <Mark v={v} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
          <p className="text-caption">▲ incluso na cota. Valores em reais; cotas personalizadas podem ser negociadas com o comercial.</p>
        </section>

        {/* Contato comercial */}
        <section id="contato" className="mx-auto grid w-full max-w-page scroll-mt-8 gap-15 px-4 sm:px-6 md:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-6">
            <Eyebrow>Contato comercial</Eyebrow>
            <h2 className="font-display text-heading">Vamos conversar sobre a sua cota</h2>
            <p className="max-w-[40ch] text-body-md">
              Fale com o time comercial pelo WhatsApp ou e-mail. Retornamos com a proposta e os próximos passos.
            </p>
            <ButtonAnchor href={`https://wa.me/${commercial.wa}`} target="_blank" rel="noreferrer" variant="primary" size="lg" className="self-stretch sm:self-start">
              Chamar no WhatsApp
            </ButtonAnchor>
          </div>
          <ul className="flex flex-col border-t border-ink">
            {commercialContacts.map((c) => (
              <li key={c.email} className="grid gap-2 border-b border-ash py-6 sm:grid-cols-[1fr_1.2fr]">
                <div>
                  <p className="text-body-md font-semibold">{c.name}</p>
                  <p className="text-body">{c.role}</p>
                </div>
                <div className="flex flex-col gap-1 text-body">
                  <a href={`https://wa.me/${c.wa}`} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                    {c.phone}
                  </a>
                  <a href={`mailto:${c.email}`} className="underline underline-offset-4 break-all">
                    {c.email}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
