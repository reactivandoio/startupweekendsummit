import Image from "next/image";
import Link from "next/link";
import { SiteNavLinks } from "@/components/site-nav";
import { ThemeToggle } from "@/components/theme";
import { site } from "@/content/site";

/* Topo de toda página pública: logo à esquerda (positivo no claro, negativo no escuro) e, no desktop,
   os links à direita com o botão de tema. No celular os links ficam no menu flutuante embaixo
   (MobileNav, no layout raiz) e só o botão de tema fica no topo. */
export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-page items-center justify-between gap-6 px-4 py-5 sm:px-6">
      <Link href="/" aria-label={site.name} className="shrink-0">
        <SiteLogo className="h-[52px] w-auto sm:h-[60px]" />
      </Link>
      <div className="flex items-center gap-6">
        <SiteNavLinks />
        <ThemeToggle />
      </div>
    </header>
  );
}

/* Logo do tema: os dois SVGs vão no HTML e o CSS mostra um só, sem esperar JavaScript */
export function SiteLogo({ className = "" }: { className?: string }) {
  return (
    <>
      <Image src="/logo-positivo.svg" alt={site.name} width={129} height={60} priority className={`dark:hidden ${className}`} />
      <Image src="/logo-negativo.svg" alt={site.name} width={129} height={60} priority className={`hidden dark:block ${className}`} />
    </>
  );
}
