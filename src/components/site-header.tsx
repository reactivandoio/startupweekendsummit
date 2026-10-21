import Image from "next/image";
import Link from "next/link";
import { site } from "@/content/site";

const links = [
  { href: "/#sobre", label: "O evento" },
  { href: "/#programacao", label: "Programação" },
  { href: "/patrocinio", label: "Patrocínio" },
  { href: "/voluntarios", label: "Voluntários" },
];

/* Nav sobre o papel branco do hero de toda página: logo positivo à esquerda, links à direita.
   No celular ficam só os links das páginas (Patrocínio, Voluntários); as âncoras da home somem. */
export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-page items-center justify-between gap-6 px-4 py-5 sm:px-6">
      <Link href="/" aria-label={site.name} className="shrink-0">
        <Image src="/logo-positivo.svg" alt={site.name} width={129} height={60} priority className="h-[52px] w-auto sm:h-[60px]" />
      </Link>
      <nav aria-label="Principal" className="flex items-center gap-5 whitespace-nowrap text-body tracking-[0.03em] sm:gap-6">
        {links.map((l, i) => (
          <Link
            key={l.href}
            href={l.href}
            className={`decoration-grass decoration-2 underline-offset-[6px] hover:underline ${i < 2 ? "hidden md:inline" : ""}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
