import type { Metadata } from "next";
import { Eyebrow } from "@/components/eyebrow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { commercialContacts, site, sponsorship, stats } from "@/content/site";

const title = `Patrocínio | ${site.name}`;

export const metadata: Metadata = {
  title: "Patrocínio",
  description: site.seoDescriptionSponsors,
  alternates: { canonical: "/patrocinio" },
  openGraph: { url: "/patrocinio", title, description: site.seoDescriptionSponsors },
  twitter: { card: "summary_large_image", title, description: site.seoDescriptionSponsors },
};

const commercial = commercialContacts[0];

// Fundos chapados dos cards de cota, na paleta do mural
const tierColors = ["bg-indigo text-paper", "bg-emerald-band", "bg-mint-wash", "bg-lavender", "bg-yellow"];

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
  return <span className="font-mono tracking-[0.03em]">{v}</span>;
}

export default function PatrocinioPage() {
  return (
    <>
      {/* Hero preto com CTA outlined pro comercial */}
      <section className="bg-obsidian text-paper">
        <SiteHeader />
        <div className="mx-auto flex max-w-page flex-col gap-12 px-4 pb-20 pt-16 sm:px-6 md:pb-30 md:pt-30">
          <div className="flex flex-col gap-6">
            <Eyebrow light>Patrocínio</Eyebrow>
            <h1 className="font-display text-display">Seja visto como apoiador do ecossistema empreendedor no Brasil.</h1>
          </div>
          <p className="max-w-[60ch] text-body-md">
            Promova o desenvolvimento de comunidades de startups e respalde a geração de líderes que vai comandar o
            rumo do empreendedorismo no país. Goiânia recebe o Summit em {site.date}.
          </p>
          <a
            href="#cotas"
            className="flex h-16 w-full items-center justify-center border border-paper text-subheading transition-colors hover:bg-paper hover:text-obsidian"
          >
            Ver cotas de patrocínio
          </a>
        </div>
      </section>

      {/* Faixa esmeralda: números da última edição */}
      <section className="bg-emerald-band text-ink">
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
        {/* Por que patrocinar */}
        <section className="mx-auto flex w-full max-w-page flex-col gap-15 px-4 sm:px-6">
          <div className="flex flex-col gap-6">
            <Eyebrow>Por que patrocinar</Eyebrow>
            <h2 className="font-display text-heading">O que sua marca ganha</h2>
          </div>
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((r, i) => (
              <li key={r.title} className="flex flex-col gap-4 border-t border-ink pt-4">
                <span className="font-mono text-body tracking-[0.03em]">{String(i + 1).padStart(2, "0")}</span>
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
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {sponsorship.tiers.map((t, i) => (
              <li key={t.id} className={`flex aspect-square flex-col justify-between p-4 ${tierColors[i]}`}>
                <span className="font-mono text-body tracking-[0.03em]">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-display text-subheading">{t.name}</h3>
                  <p className="text-body-md font-semibold">{t.price}</p>
                  {t.note && <p className="text-caption">{t.note}</p>}
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
            <a
              href={`https://wa.me/${commercial.wa}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-16 items-center justify-center border border-ink text-subheading text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              WhatsApp {commercial.phone}
            </a>
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
