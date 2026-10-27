"use client";

import { useActionState } from "react";
import { saveSiteTheme, type ThemeFormState } from "@/app/admin/actions";
import { Button } from "@/components/button";
import { ThemeIcon } from "@/components/theme";
import { themeLabel, type Theme } from "@/lib/theme-core";

const themes: Theme[] = ["dark", "light"];
const hint: Record<Theme, string> = {
  dark: "Papel preto, tinta clara; logo negativo e ilustrações em branco.",
  light: "Papel branco, tinta preta; a versão original da marca.",
};

// Opções selecionáveis: borda Ash que vira Ink quando marcada — sem cor de estado (como no formulário de voluntários)
const choiceClass = "flex cursor-pointer items-start gap-4 border border-ash p-4 text-body transition-colors has-checked:border-ink";

/* Tema padrão do site: Escuro ou Claro, salvo no banco. Quem entra pela primeira vez vê este tema,
   independente da preferência do sistema; a escolha feita no botão do site tem prioridade. */
export function SiteThemeForm({ current }: { current: Theme }) {
  const [state, action, pending] = useActionState(saveSiteTheme, { status: "idle" } as ThemeFormState);
  return (
    <form action={action} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-body font-semibold">Tema padrão</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {themes.map((t) => (
            <label key={t} className={choiceClass}>
              <input type="radio" name="theme" value={t} defaultChecked={current === t} className="mt-1 h-4 w-4 accent-ink" />
              <span className="flex flex-col gap-1">
                <span className="flex items-center gap-2 font-semibold">
                  <ThemeIcon theme={t === "dark" ? "light" : "dark"} size={16} />
                  {themeLabel[t]}
                </span>
                <span className="text-caption">{hint[t]}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {state.message && (
        <p className="text-caption font-semibold" role={state.status === "error" ? "alert" : "status"}>
          — {state.message}
        </p>
      )}
      <Button type="submit" variant="primary" disabled={pending} className="self-start">
        {pending ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
