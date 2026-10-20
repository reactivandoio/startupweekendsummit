import Image from "next/image";
import Link from "next/link";
import { site } from "@/content/site";

const links = [
  { href: "/#sobre", label: "O evento" },
  { href: "/#programacao", label: "Programação" },
  { href: "/patrocinio", label: "Patrocínio" },
  { href: "/voluntarios", label: "Voluntários" },
];

/* Nav transparente sobre o hero de cada página: logo à esquerda, links à direita.
   tone="dark" (padrão) para heros pretos; tone="light" para o hero em papel da home. */
export function SiteHeader({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const light = tone === "light";
  return (
    <header className="mx-auto flex max-w-page items-center justify-between gap-6 px-4 py-5 sm:px-6">
      <Link href="/" aria-label={site.name}>
        <Image
          src={light ? "/logo-positivo.svg" : "/logo-negativo.svg"}
          alt={site.name}
          width={129}
          height={60}
          priority
          className="h-[60px] w-auto"
        />
      </Link>
      <nav className="flex items-center gap-6 whitespace-nowrap text-body tracking-[0.03em]">
        {links.map((l, i) => (
          <Link
            key={l.href}
            href={l.href}
            className={`underline-offset-[6px] hover:underline ${light ? "decoration-grass" : "decoration-marigold"} decoration-2 ${i < 2 ? "hidden md:inline" : ""}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
