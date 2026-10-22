import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { getSetting } from "@/lib/settings";
import { DEFAULT_THEME, parseTheme, THEME_COOKIE, type Theme } from "@/lib/theme-core";

// Tema padrão escolhido no painel. Com o banco fora (ou antes da primeira escolha), vale o inicial.
// cache(): layout e generateViewport perguntam na mesma requisição; uma consulta só.
export const getDefaultTheme = cache(async (): Promise<Theme> => {
  try {
    return parseTheme(await getSetting("site_theme")) ?? DEFAULT_THEME;
  } catch (err) {
    console.error("[theme] padrão", err);
    return DEFAULT_THEME;
  }
});

// Tema desta requisição: a escolha do visitante (cookie) vence o padrão do painel.
// cookies() torna a rota dinâmica — é o que garante o tema certo já no HTML, sem flash.
export async function resolveTheme(): Promise<Theme> {
  const chosen = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return chosen ?? getDefaultTheme();
}
