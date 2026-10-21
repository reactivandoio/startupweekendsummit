import Image from "next/image";
import Link from "next/link";
import { SiteNavLinks } from "@/components/site-nav";
import { site } from "@/content/site";

/* Topo de toda página pública: logo positivo à esquerda e, no desktop, os links à direita.
   No celular os links ficam no menu flutuante embaixo (MobileNav, no layout raiz). */
export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-page items-center justify-between gap-6 px-4 py-5 sm:px-6">
      <Link href="/" aria-label={site.name} className="shrink-0">
        <Image src="/logo-positivo.svg" alt={site.name} width={129} height={60} priority className="h-[52px] w-auto sm:h-[60px]" />
      </Link>
      <SiteNavLinks />
    </header>
  );
}
