"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { signOut } from "@/app/admin/actions";
import { site } from "@/content/site";
import type { User } from "@/lib/auth";

type NavItem = { href: string; label: string; icon: React.ReactNode };

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "square" as const };

const nav: NavItem[] = [
  {
    href: "/admin",
    label: "Voluntários",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" {...stroke}>
        <path d="M3 5h14M3 10h14M3 15h9" />
      </svg>
    ),
  },
  {
    href: "/admin/participantes",
    label: "Participantes",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" {...stroke}>
        <path d="M3 6h14v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4V6Z" />
        <path d="M8 6v10" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    href: "/admin/convites",
    label: "Convites",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" {...stroke}>
        <path d="M3 5h14v11H3z" />
        <path d="M3 6l7 5 7-5" />
      </svg>
    ),
  },
  {
    href: "/admin/usuarios",
    label: "Usuários",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" {...stroke}>
        <circle cx="10" cy="7" r="3.5" />
        <path d="M3.5 17.5c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" />
      </svg>
    ),
  },
];

const STORAGE_KEY = "sws-admin-sidebar";
const THEME_KEY = "sws-admin-theme";
type Theme = "light" | "dark";

/* Preferências em localStorage lidas como store externo: sem setState em effect e sincronizado entre abas */
const PREF_EVENT = "sws-admin-pref";
function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(PREF_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(PREF_EVENT, cb);
  };
}
function readPref(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writePref(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
  window.dispatchEvent(new Event(PREF_EVENT));
}
const readCollapsed = () => readPref(STORAGE_KEY) === "1";
const readTheme = (): Theme => {
  const saved = readPref(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

/* Moldura do painel: sidebar preta recolhível + header com breadcrumb + conteúdo com rolagem própria */
export function AdminShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  // no servidor (e durante a hidratação) usa os padrões; depois lê a preferência salva
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);
  const toggle = () => writePref(STORAGE_KEY, collapsed ? "0" : "1");
  const toggleTheme = () => writePref(THEME_KEY, theme === "dark" ? "light" : "dark");

  // aplica no <html> só enquanto o painel está montado; o site público não usa data-theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [theme]);

  const current = nav.find((n) => n.href === pathname) ?? nav.find((n) => n.href !== "/admin" && pathname.startsWith(n.href));

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-paper text-ink dark:bg-ink dark:text-paper">
      {/* Sidebar */}
      <aside
        className={`flex shrink-0 flex-col justify-between bg-obsidian text-paper transition-[width] duration-150 dark:border-r dark:border-graphite ${
          collapsed ? "w-16" : "w-16 md:w-64"
        }`}
      >
        <div className="flex flex-col">
          <Link href="/admin" aria-label="Painel" className="flex h-16 items-center border-b border-graphite px-4">
            {collapsed ? (
              <span className="flex h-8 w-8 items-center justify-center bg-paper font-display text-caption font-bold text-obsidian">
                ts_
              </span>
            ) : (
              <>
                <span className="flex h-8 w-8 items-center justify-center bg-paper font-display text-caption font-bold text-obsidian md:hidden">
                  ts_
                </span>
                <Image src="/logo-negativo.png" alt={site.name} width={86} height={40} priority className="hidden h-[40px] w-auto md:block" />
              </>
            )}
          </Link>
          <nav className="flex flex-col py-2" aria-label="Seções do painel">
            {nav.map((n) => {
              const active = n === current;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  title={n.label}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-12 items-center gap-3 border-l-2 px-4 text-body tracking-[0.03em] transition-colors hover:bg-ink ${
                    active ? "border-paper bg-ink" : "border-transparent"
                  }`}
                >
                  <span className="shrink-0">{n.icon}</span>
                  <span className={collapsed ? "sr-only" : "sr-only md:not-sr-only md:truncate"}>{n.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col border-t border-graphite">
          <div className={`flex flex-col gap-1 px-4 py-3 ${collapsed ? "hidden" : "hidden md:flex"}`}>
            <p className="truncate text-caption" title={user.email}>
              {user.name || user.email}
            </p>
            {user.name && (
              <p className="truncate text-caption text-paper/60" title={user.email}>
                {user.email}
              </p>
            )}
          </div>
          <form action={signOut}>
            <button
              type="submit"
              title="Sair"
              className="flex h-12 w-full items-center gap-3 px-4 text-body tracking-[0.03em] transition-colors hover:bg-ink"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" {...stroke}>
                <path d="M8 3H3v14h5M12 6l4 4-4 4M7 10h9" />
              </svg>
              <span className={collapsed ? "sr-only" : "sr-only md:not-sr-only"}>Sair</span>
            </button>
          </form>
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Tema claro" : "Tema escuro"}
            className="flex h-12 items-center gap-3 border-t border-graphite px-4 text-body tracking-[0.03em] transition-colors hover:bg-ink"
          >
            {theme === "dark" ? (
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" {...stroke}>
                <circle cx="10" cy="10" r="3.5" />
                <path d="M10 2v2.5M10 15.5V18M2 10h2.5M15.5 10H18M4.3 4.3l1.8 1.8M13.9 13.9l1.8 1.8M4.3 15.7l1.8-1.8M13.9 6.1l1.8-1.8" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" {...stroke}>
                <path d="M16 12.5A7 7 0 0 1 7.5 4a7 7 0 1 0 8.5 8.5Z" />
              </svg>
            )}
            <span className={collapsed ? "sr-only" : "sr-only md:not-sr-only"}>{theme === "dark" ? "Claro" : "Escuro"}</span>
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
            className="hidden h-12 items-center gap-3 border-t border-graphite px-4 text-body tracking-[0.03em] transition-colors hover:bg-ink md:flex"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" {...stroke} className={collapsed ? "rotate-180" : ""}>
              <path d="M12 4l-6 6 6 6M17 4v12" />
            </svg>
            <span className={collapsed ? "sr-only" : ""}>Recolher</span>
          </button>
        </div>
      </aside>

      {/* Coluna de conteúdo: header fixo, main rola */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-ash px-6 dark:border-graphite">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-body tracking-[0.03em]">
            <Link href="/admin" className="hover:underline hover:underline-offset-4">
              Painel
            </Link>
            {current && (
              <>
                <span className="text-ash dark:text-graphite" aria-hidden="true">
                  /
                </span>
                <span className="font-semibold" aria-current="page">
                  {current.label}
                </span>
              </>
            )}
          </nav>
          <Link href="/" className="hidden text-caption tracking-[0.03em] hover:underline hover:underline-offset-4 sm:inline">
            Ver site ↗
          </Link>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="w-full p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
