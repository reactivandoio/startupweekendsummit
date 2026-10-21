import Link from "next/link";
import { Eyebrow } from "@/components/eyebrow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export type LegalSection = { id: string; title: string; content: string };

const linkClass = "underline decoration-grass decoration-2 underline-offset-4 hover:text-grass-deep";

/* Marcação mínima no texto: **negrito** e [rótulo](/rota) */
function inline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={k++}>{m[1]}</strong>);
    else
      out.push(
        <Link key={k++} href={m[3]} className={linkClass}>
          {m[2]}
        </Link>,
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

/* Página de documento (termos, privacidade): papel branco, índice e seções em coluna de leitura */
export function LegalPage({
  eyebrow,
  title,
  updated,
  sections,
  related,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  sections: LegalSection[];
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
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="underline-offset-4 hover:underline">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="flex max-w-[70ch] flex-col gap-12">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="flex scroll-mt-8 flex-col gap-4 text-body-md leading-normal">
                <h2 className="font-display text-subheading">{s.title}</h2>
                {blocks(s.content)}
              </section>
            ))}
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
