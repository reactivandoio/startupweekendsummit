import Image from "next/image";
import Link from "next/link";
import { site } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="bg-obsidian text-paper">
      <div className="mx-auto flex max-w-page flex-col justify-between gap-8 px-4 py-15 sm:flex-row sm:items-end sm:px-6">
        <div className="flex flex-col gap-6">
          <Image src="/logo-negativo.png" alt={site.name} width={172} height={80} className="h-[80px] w-auto self-start" />
          <p className="text-body">
            © {new Date().getFullYear()} Techstars Startup Weekend Summit Brasil · {site.city}. Organização voluntária
            da comunidade Startup Weekend em Goiás.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-body tracking-[0.03em]">
          <Link href="/voluntarios" className="hover:underline hover:underline-offset-4">
            Voluntários
          </Link>
          <Link href="/patrocinio" className="hover:underline hover:underline-offset-4">
            Patrocínio
          </Link>
          <a href={site.instagram} target="_blank" rel="noreferrer" className="hover:underline hover:underline-offset-4">
            Instagram
          </a>
          <a href={site.whatsappUrl} target="_blank" rel="noreferrer" className="hover:underline hover:underline-offset-4">
            WhatsApp
          </a>
          <a href={`mailto:${site.contactEmail}`} className="hover:underline hover:underline-offset-4">
            Contato
          </a>
        </div>
      </div>
    </footer>
  );
}
