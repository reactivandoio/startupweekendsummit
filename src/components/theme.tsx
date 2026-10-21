"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { otherTheme, THEME_COOKIE, THEME_COOKIE_MAX_AGE, themeLabel, type Theme } from "@/lib/theme-core";

type ThemeContext = { theme: Theme; setTheme: (theme: Theme) => void };
const Ctx = createContext<ThemeContext | null>(null);

/* O tema chega resolvido do servidor (cookie do visitante ou padrão do painel) e já está no <html>;
   aqui ele vira estado pra quem precisa trocar imagem (ilustrações) e pro botão de alternar. */
export function ThemeProvider({ initial, children }: { initial: Theme; children: React.ReactNode }) {
  const [theme, setState] = useState(initial);
  const setTheme = useCallback((next: Theme) => {
    setState(next);
    document.documentElement.dataset.theme = next;
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${THEME_COOKIE}=${next}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  }, []);
  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme precisa do ThemeProvider (layout raiz)");
  return ctx;
}

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "square" as const };

/* Sol (no escuro) ou lua (no claro): o ícone mostra o tema pra onde o botão leva */
export function ThemeIcon({ theme, size = 20 }: { theme: Theme; size?: number }) {
  return theme === "dark" ? (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" {...stroke}>
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2v2.5M10 15.5V18M2 10h2.5M15.5 10H18M4.3 4.3l1.8 1.8M13.9 13.9l1.8 1.8M4.3 15.7l1.8-1.8M13.9 6.1l1.8-1.8" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" {...stroke}>
      <path d="M16 12.5A7 7 0 0 1 7.5 4a7 7 0 1 0 8.5 8.5Z" />
    </svg>
  );
}

/* Botão do site: quadrado com borda Ink, como os demais controles da marca. Lembra a escolha no cookie. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const next = otherTheme(theme);
  const label = `Tema ${themeLabel[next].toLowerCase()}`;
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className={`flex h-10 w-10 shrink-0 items-center justify-center border-2 border-ink text-ink transition-colors hover:bg-ink hover:text-paper ${className}`}
    >
      <ThemeIcon theme={theme} />
    </button>
  );
}
