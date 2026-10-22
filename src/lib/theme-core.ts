// Tema do site (claro/escuro): o que é puro e serve a servidor e navegador.
// O padrão vem do painel (/admin/configuracoes, tabela settings); a escolha do visitante fica
// no cookie e tem prioridade. O servidor lê os dois e já manda data-theme no <html>: sem flash.

export type Theme = "dark" | "light";

export const THEME_COOKIE = "sws-theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 ano
// Valor inicial do tema padrão, enquanto ninguém mexeu no painel (decisão do Pedro: escuro)
export const DEFAULT_THEME: Theme = "dark";

export const themeLabel: Record<Theme, string> = { dark: "Escuro", light: "Claro" };
// <meta name="theme-color">: barra do navegador no celular com a cor do papel de cada tema
export const themeColor: Record<Theme, string> = { dark: "#0f0f0f", light: "#ffffff" };

export function parseTheme(value: unknown): Theme | null {
  return value === "dark" || value === "light" ? value : null;
}

export const otherTheme = (theme: Theme): Theme => (theme === "dark" ? "light" : "dark");
