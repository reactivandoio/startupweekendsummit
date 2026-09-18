import Image from "next/image";
import Link from "next/link";
import { site } from "@/content/site";

const links = [
  { href: "/#sobre", label: "O evento" },
  { href: "/#programacao", label: "Programação" },
  { href: "/patrocinio", label: "Patrocínio" },
  { href: "/voluntarios", label: "Voluntários" },
];

/* Nav transparente sobre o hero preto de cada página: logo à esquerda, links à direita */
export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-page items-center justify-between gap-6 px-4 py-5 sm:px-6">
      <Link href="/" aria-label={site.name}>
        <Image src="/logo-negativo.png" alt={site.name} width={129} height={60} priority className="h-[60px] w-auto" />
      </Link>
      <nav className="flex items-center gap-6 whitespace-nowrap text-body tracking-[0.03em]">
        {links.map((l, i) => (
          <Link
            key={l.href}
            href={l.href}
            className={`hover:underline hover:underline-offset-4 ${i < 2 ? "hidden md:inline" : ""}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
