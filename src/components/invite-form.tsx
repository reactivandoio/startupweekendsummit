"use client";

import { useActionState } from "react";
import { createInviteAction, type InviteFormState } from "@/app/admin/actions";
import { CopyButton } from "@/components/copy-button";

export function InviteForm() {
  const [state, action, pending] = useActionState(createInviteAction, { status: "idle" } as InviteFormState);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="i-name" className="text-body font-semibold">
          Nome do convidado
        </label>
        <input id="i-name" name="name" type="text" className="field" placeholder="Opcional — aparece na página do convite" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="i-email" className="text-body font-semibold">
          E-mail
        </label>
        <input id="i-email" name="email" type="email" className="field" placeholder="Opcional — pra enviar o link direto" />
      </div>
      <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="i-max" className="text-body font-semibold">
            Vagas
          </label>
          <input id="i-max" name="maxUses" type="number" min={1} max={500} defaultValue={1} className="field" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="i-note" className="text-body font-semibold">
            Observação
          </label>
          <input id="i-note" name="note" type="text" className="field" placeholder="Ex.: comunidade SW Anápolis" />
        </div>
      </div>
      <label className="flex items-center gap-3 text-body">
        <input type="checkbox" name="send" defaultChecked className="h-4 w-4 accent-ink" />
        Enviar o convite por e-mail ao criar
      </label>
      {state.message && (
        <div className="flex flex-col gap-2" role="status">
          <p className="text-caption font-semibold">— {state.message}</p>
          {state.url && (
            <div className="flex flex-wrap items-center gap-2">
              <code className="break-all font-mono text-caption">{state.url}</code>
              <CopyButton text={state.url} />
            </div>
          )}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start border border-ink px-6 py-3 text-body transition-colors hover:bg-ink hover:text-paper dark:border-paper dark:hover:bg-paper dark:hover:text-ink disabled:cursor-not-allowed disabled:border-ash disabled:text-ink/50 disabled:hover:bg-transparent"
      >
        {pending ? "Criando…" : "Criar convite"}
      </button>
    </form>
  );
}
