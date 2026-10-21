"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TOP, useActiveSection } from "@/components/use-active-section";

/* `sections`: ids das seções da home que pertencem ao item (scroll spy). Toda seção abaixo do hero está em algum grupo,
   pra nunca ficar sem aba ativa no meio da página. */
type Item = { href: string; label: string; short?: string; sections?: string[]; icon: React.ReactNode };

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "square" as const, strokeLinejoin: "miter" as const };
const Icon = ({ d }: { d: string }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" {...stroke}>
    <path d={d} />
  </svg>
);

const home: Item = { href: "/", label: "Início", icon: <Icon d="M3 10.5 11 3l8 7.5M5 9.5V19h12V9.5M9 19v-5h4v5" /> };
const sections: Item[] = [
  { href: "/#sobre", label: "O evento", sections: ["o-evento", "sobre", "after-movie"], icon: <Icon d="M3 5h16v11H8l-5 3V5ZM7 9h8M7 12h5" /> },
  { href: "/#programacao", label: "Programação", short: "Agenda", sections: ["programacao"], icon: <Icon d="M3 5h16v14H3zM3 9h16M7 3v4M15 3v4M7 13h3v3H7z" /> },
];
const pages: Item[] = [
  { href: "/patrocinio", label: "Patrocínio", sections: ["patrocinadores", "chamadas"], icon: <Icon d="M3 7h16v12H3zM3 11h16M8 7V4h6v3M9 15h4" /> },
  { href: "/voluntarios", label: "Voluntários", icon: <Icon d="M7.5 6.5a3 3 0 1 0 6 0 3 3 0 0 0-6 0ZM3 19c0-3.5 3.5-6 7.5-6s7.5 2.5 7.5 6M16 4l1.5 1.5L19 4" /> },
];
const sectionIds = [...sections, ...pages].flatMap((s) => s.sections ?? []);

function useActive() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const section = useActiveSection(sectionIds, onHome);
  const isActive = (item: Item) => {
    if (onHome) return item.href === "/" ? section === TOP : !!section && !!item.sections?.includes(section);
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };
  // "page" quando é a página atual; "location" quando é uma seção da home em vista
  const current = (item: Item): "page" | "location" | undefined => (isActive(item) ? (onHome && item.href !== "/" ? "location" : "page") : undefined);
  return { isActive, current };
}

/* Links do topo (desktop). Nas âncoras da home, o destaque acompanha a seção que está na tela. */
export function SiteNavLinks() {
  const { isActive, current } = useActive();
  return (
    <nav aria-label="Principal" className="hidden items-center gap-6 whitespace-nowrap text-body tracking-[0.03em] md:flex">
      {[...sections, ...pages].map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current(item)}
            className={`border-b-2 pb-1 decoration-grass underline-offset-[6px] transition-[border-color,color] duration-200 hover:underline ${
              active ? "border-grass text-ink" : "border-transparent"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/* Menu flutuante do celular: fixo embaixo, com margem e safe-area do iPhone; o body reserva o espaço (globals.css).
   Some no painel (/admin) e no desktop. */
export function MobileNav() {
  const pathname = usePathname();
  const { isActive, current } = useActive();
  if (pathname.startsWith("/admin")) return null;
  return (
    <nav
      data-mobile-nav=""
      aria-label="Principal"
      className="fixed inset-x-4 z-40 border-2 border-ink bg-paper text-ink shadow-hard-sm md:hidden"
      style={{ bottom: "calc(16px + env(safe-area-inset-bottom))" }}
    >
      <ul className="flex items-stretch">
        {[home, ...sections, ...pages].map((item) => {
          const active = isActive(item);
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={current(item)}
                className={`flex h-16 flex-col items-center justify-center gap-1 border-t-[3px] px-0.5 text-[10px] font-semibold leading-none transition-[background-color,color,border-color] duration-200 ${
                  active ? "border-grass bg-marigold-wash text-ink" : "border-transparent text-graphite"
                }`}
              >
                {item.icon}
                <span className="max-w-full truncate">{item.short ?? item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
