import Image from "next/image";
import Link from "next/link";
import { site } from "@/content/site";

const linkClass = "decoration-marigold decoration-2 underline-offset-[6px] hover:underline";

export function SiteFooter() {
  return (
    <footer className="bg-obsidian text-white">
      <div aria-hidden="true" className="h-3 bg-linear-to-r from-grass to-marigold" />
      <div className="mx-auto flex max-w-page flex-col justify-between gap-8 px-4 py-15 sm:flex-row sm:items-end sm:px-6">
        <div className="flex flex-col gap-6">
          <Image src="/logo-negativo.svg" alt={site.name} width={172} height={80} className="h-[80px] w-auto self-start" />
          <p className="font-display text-subheading font-bold">
            Bora pro futuro<span className="text-marigold">_</span>
          </p>
          <p className="text-body">
            © {new Date().getFullYear()} Techstars Startup Weekend Summit Brasil · {site.city}. Organização voluntária
            da comunidade Startup Weekend em Goiás.
          </p>
        </div>
        <div className="flex max-w-[28rem] flex-wrap gap-x-6 gap-y-3 text-body tracking-[0.03em] sm:justify-end">
          <Link href="/voluntarios" className={linkClass}>
            Voluntários
          </Link>
          <Link href="/patrocinio" className={linkClass}>
            Patrocínio
          </Link>
          <a href={site.instagram} target="_blank" rel="noreferrer" className={linkClass}>
            Instagram
          </a>
          <a href={site.whatsappUrl} target="_blank" rel="noreferrer" className={linkClass}>
            WhatsApp
          </a>
          <a href={`mailto:${site.contactEmail}`} className={linkClass}>
            Contato
          </a>
          <Link href="/termos-de-uso" className={linkClass}>
            Termos de uso
          </Link>
          <Link href="/politica-de-privacidade" className={linkClass}>
            Privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}
