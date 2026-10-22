import Link from "next/link";
import { buttonClass } from "@/components/button";
import { Eyebrow } from "@/components/eyebrow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export type LegalSection = { id: string; title: string; content: string };
export type LegalIntro = { label: string; text: string };
export type LegalClosing = { text: string; cta?: { href: string; label: string } };

const linkClass = "underline decoration-grass decoration-2 underline-offset-4 hover:text-grass-deep";

/* Marcação mínima no texto: **negrito** e [rótulo](/rota | https://… | mailto:…). E-mails sempre como link: o Cloudflare
   ofusca endereços no HTML e, em texto corrido, isso quebra a hidratação (React #418). Links http abrem em nova aba. */
function inline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={k++}>{m[1]}</strong>);
    else if (m[3].startsWith("/"))
      out.push(
        <Link key={k++} href={m[3]} className={linkClass}>
          {m[2]}
        </Link>,
      );
    else if (m[3].startsWith("http"))
      out.push(
        <a key={k++} href={m[3]} target="_blank" rel="noreferrer" className={linkClass}>
          {m[2]}
          <span className="sr-only"> (abre em nova aba)</span>
        </a>,
      );
    else
      out.push(
        <a key={k++} href={m[3]} className={linkClass}>
          {m[2]}
        </a>,
      );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/* Parágrafos separados por linha em branco; linhas começando com "•" viram lista */
function blocks(content: string) {
  return content
    .trim()
    .split(/\n\s*\n/)
    .map((block, i) => {
      const lines = block.split("\n");
      if (lines.every((l) => l.trim().startsWith("•"))) {
        return (
          <ul key={i} className="flex flex-col gap-2 border-l-2 border-marigold pl-4">
            {lines.map((l, j) => (
              <li key={j}>{inline(l.replace(/^\s*•\s*/, ""))}</li>
            ))}
          </ul>
        );
      }
      return <p key={i}>{lines.map((l, j) => (j ? [<br key={j} />, inline(l)] : inline(l)))}</p>;
    });
}

/* Numeração das seções: quadrado com borda e sombra sólida (recurso Techstars), alternando Marigold e Grass */
// Texto preto fixo sobre Marigold e Grass: no escuro a tinta vira clara e não passaria AA.
const badge = ["bg-marigold text-obsidian", "bg-grass text-obsidian"];

/* Página de documento (termos, privacidade), no padrão dos Termos de Participação do Startup Weekend Anápolis:
   papel branco, caixa de descrição no topo, seções numeradas e fechamento com o aceite. Índice lateral para navegação. */
export function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  sections,
  closing,
  related,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro?: LegalIntro;
  sections: LegalSection[];
  closing?: LegalClosing;
  related: { href: string; label: string };
}) {
  return (
    <>
      <section className="bg-paper text-ink">
        <SiteHeader />
        <div className="mx-auto flex max-w-page flex-col gap-6 px-4 pb-12 pt-8 sm:px-6 md:pb-16 md:pt-14">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="max-w-[16ch] font-display text-heading-lg text-balance">{title}</h1>
          <p className="text-body-md">Última atualização: {updated}</p>
        </div>
      </section>
      <main className="bg-paper py-15 text-ink md:py-30">
        <div className="mx-auto grid max-w-page gap-12 px-4 sm:px-6 md:grid-cols-[280px_1fr] md:gap-15">
          <nav aria-label="Índice" className="flex flex-col gap-3 self-start border-t-4 border-grass pt-4 md:sticky md:top-8">
            <p className="text-body-md font-semibold">Índice</p>
            <ol className="flex flex-col gap-2 text-body">
              {sections.map((s, i) => (
                <li key={s.id} className="flex gap-2">
                  <span aria-hidden="true" className="w-5 shrink-0 font-semibold text-grass-deep">
                    {i + 1}
                  </span>
                  <a href={`#${s.id}`} className="underline-offset-4 hover:underline">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="flex max-w-[70ch] flex-col gap-12">
            {intro && (
              <div className="flex flex-col gap-4 border-2 border-ink bg-paper p-6 shadow-hard md:p-8">
                <Eyebrow>{intro.label}</Eyebrow>
                <p className="font-display text-subheading font-semibold leading-snug text-balance">{intro.text}</p>
              </div>
            )}
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="flex scroll-mt-8 flex-col gap-5 text-body-md leading-normal">
                <h2 className="flex items-center gap-4 font-display text-subheading">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center border-2 border-ink font-display text-body-md font-bold shadow-hard-sm ${badge[i % badge.length]}`}
                  >
                    {i + 1}
                  </span>
                  <span className="sr-only">. </span>
                  {s.title}
                </h2>
                {blocks(s.content)}
              </section>
            ))}
            {closing && (
              <div className="flex flex-col gap-5 border-2 border-ink bg-marigold-wash p-6 shadow-hard md:p-8">
                <p className="text-body-md font-semibold">{closing.text}</p>
                {closing.cta &&
                  (closing.cta.href.startsWith("/") ? (
                    <Link href={closing.cta.href} className={buttonClass("secondary", "md", "self-start")}>
                      {closing.cta.label}
                    </Link>
                  ) : (
                    <a href={closing.cta.href} className={buttonClass("secondary", "md", "max-w-full self-start break-all")}>
                      {closing.cta.label}
                    </a>
                  ))}
              </div>
            )}
            <p className="border-t border-ink pt-6 text-body">
              Veja também:{" "}
              <Link href={related.href} className={linkClass}>
                {related.label}
              </Link>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
