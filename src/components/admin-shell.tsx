"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { signOut } from "@/app/admin/actions";
import { ThemeIcon, useTheme } from "@/components/theme";
import { site } from "@/content/site";
import type { User } from "@/lib/auth";
import { otherTheme, themeLabel } from "@/lib/theme-core";

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
    href: "/admin/ingressos",
    label: "Ingressos",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" {...stroke}>
        <path d="M3 4h14v12H3z" />
        <path d="M3 8h14M7 12h2M11 12h2" />
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
    href: "/admin/patrocinadores",
    label: "Patrocinadores",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" {...stroke}>
        <path d="M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z" />
      </svg>
    ),
  },
  {
    href: "/admin/organizadores",
    label: "Organizadores",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" {...stroke}>
        <circle cx="7" cy="7" r="2.75" />
        <circle cx="14" cy="8" r="2.25" />
        <path d="M1.75 16.5c0-2.9 2.3-4.75 5.25-4.75s5.25 1.85 5.25 4.75M13.5 12.25c2.6 0 4.75 1.6 4.75 4.25" />
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
  {
    href: "/admin/configuracoes",
    label: "Configurações",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" {...stroke}>
        <circle cx="10" cy="10" r="3" />
        <path d="M10 2v3M10 15v3M2 10h3M15 10h3M4.3 4.3l2.2 2.2M13.5 13.5l2.2 2.2M4.3 15.7l2.2-2.2M13.5 6.5l2.2-2.2" />
      </svg>
    ),
  },
];

const STORAGE_KEY = "sws-admin-sidebar";

/* Sidebar recolhida em localStorage lida como store externo: sem setState em effect e sincronizado entre abas */
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

const Burger = ({ open }: { open: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" {...stroke} strokeWidth={2}>
    {open ? <path d="M5 5l12 12M17 5L5 17" /> : <path d="M3 6h16M3 11h16M3 16h16" />}
  </svg>
);

/* Moldura do painel: sidebar preta (recolhível no desktop pelo ☰ ao lado do logo; gaveta no celular, aberta pelo ☰
   do cabeçalho) + header com breadcrumb + conteúdo com rolagem própria. O tema é o mesmo do site (ThemeProvider
   no layout raiz, cookie): o botão aqui embaixo troca pra tudo. A sidebar é sempre preta, com brancos fixos. */
export function AdminShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  // no servidor (e durante a hidratação) usa o padrão; depois lê a preferência salva
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);
  const { theme, setTheme } = useTheme();
  const [drawer, setDrawer] = useState(false); // gaveta do celular: não persiste
  const toggle = () => writePref(STORAGE_KEY, collapsed ? "0" : "1");
  const nextTheme = otherTheme(theme);

  // gaveta fecha ao escolher uma seção (onClick nos links) e no Esc
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  const current = nav.find((n) => n.href === pathname) ?? nav.find((n) => n.href !== "/admin" && pathname.startsWith(n.href));

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-paper text-ink">
      {/* Fundo escurecido atrás da gaveta (celular) */}
      {drawer && <button type="button" aria-label="Fechar menu" onClick={() => setDrawer(false)} className="fixed inset-0 z-30 bg-obsidian/60 md:hidden" />}

      {/* Sidebar: gaveta no celular (translate), coluna fixa no desktop (largura 64 ou 16) */}
      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col justify-between bg-obsidian text-white transition-[transform,width] duration-150 md:static md:translate-x-0 dark:border-r dark:border-white/20 ${
          drawer ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-16" : "md:w-64"}`}
      >
        <div className="flex flex-col">
          {/* Topo: logo + ☰ (aberta). Recolhida no desktop, só a marca compacta "ts_", que expande a barra. Celular: logo + X. */}
          <div className={`flex h-16 items-center border-b border-white/20 ${collapsed ? "justify-between px-4 md:justify-center md:px-0" : "justify-between px-4"}`}>
            <Link href="/admin" aria-label="Painel" className={`shrink-0 ${collapsed ? "md:hidden" : ""}`}>
              <Image src="/logo-negativo.svg" alt={site.name} width={86} height={40} priority className="h-[40px] w-auto" />
            </Link>
            {collapsed ? (
              <button
                type="button"
                onClick={toggle}
                aria-expanded={false}
                aria-controls="admin-sidebar"
                aria-label="Expandir menu"
                title="Expandir menu"
                className="hidden h-10 w-10 items-center justify-center transition-colors hover:bg-white/10 md:flex"
              >
                <span className="flex h-8 w-8 items-center justify-center bg-white font-display text-caption font-bold text-obsidian" aria-hidden="true">
                  ts_
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={toggle}
                aria-expanded={true}
                aria-controls="admin-sidebar"
                aria-label="Recolher menu"
                title="Recolher menu"
                className="hidden h-10 w-10 items-center justify-center transition-colors hover:bg-white/10 md:flex"
              >
                <Burger open={false} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setDrawer(false)}
              aria-label="Fechar menu"
              title="Fechar menu"
              className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-white/10 md:hidden"
            >
              <Burger open />
            </button>
          </div>
          <nav className="flex flex-col py-2" aria-label="Seções do painel">
            {nav.map((n) => {
              const active = n === current;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  title={n.label}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setDrawer(false)}
                  className={`flex h-12 items-center gap-3 border-l-2 px-4 text-body tracking-[0.03em] transition-colors hover:bg-white/10 ${
                    active ? "border-white bg-white/10" : "border-transparent"
                  }`}
                >
                  <span className="shrink-0">{n.icon}</span>
                  <span className={collapsed ? "md:sr-only" : "truncate"}>{n.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col border-t border-white/20">
          <div className={`flex flex-col gap-1 px-4 py-3 ${collapsed ? "md:hidden" : ""}`}>
            <p className="truncate text-caption" title={user.email}>
              {user.name || user.email}
            </p>
            {user.name && (
              <p className="truncate text-caption text-white/60" title={user.email}>
                {user.email}
              </p>
            )}
          </div>
          <form action={signOut}>
            <button
              type="submit"
              title="Sair"
              className="flex h-12 w-full items-center gap-3 px-4 text-body tracking-[0.03em] transition-colors hover:bg-white/10"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" {...stroke}>
                <path d="M8 3H3v14h5M12 6l4 4-4 4M7 10h9" />
              </svg>
              <span className={collapsed ? "md:sr-only" : ""}>Sair</span>
            </button>
          </form>
          <button
            type="button"
            onClick={() => setTheme(nextTheme)}
            title={`Tema ${themeLabel[nextTheme].toLowerCase()}`}
            className="flex h-12 items-center gap-3 border-t border-white/20 px-4 text-body tracking-[0.03em] transition-colors hover:bg-white/10"
          >
            <ThemeIcon theme={theme} />
            <span className={collapsed ? "md:sr-only" : ""}>{themeLabel[nextTheme]}</span>
          </button>
        </div>
      </aside>

      {/* Coluna de conteúdo: header fixo, main rola */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-ash px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-expanded={drawer}
              aria-controls="admin-sidebar"
              aria-label="Abrir menu"
              title="Abrir menu"
              className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-ink transition-colors hover:bg-ink hover:text-paper md:hidden"
            >
              <Burger open={false} />
            </button>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-body tracking-[0.03em]">
              <Link href="/admin" className="hover:underline hover:underline-offset-4">
                Painel
              </Link>
              {current && (
                <>
                  <span className="text-graphite" aria-hidden="true">
                    /
                  </span>
                  <span className="font-semibold" aria-current="page">
                    {current.label}
                  </span>
                </>
              )}
            </nav>
          </div>
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
