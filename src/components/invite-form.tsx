"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createInviteAction, updateInviteDiscountAction, type InviteFormState } from "@/app/admin/actions";
import { CopyButton } from "@/components/copy-button";
import { discountInputValue, NO_DISCOUNT, type DiscountKind, type InviteDiscount } from "@/lib/discounts";

const kinds: { value: DiscountKind; label: string }[] = [
  { value: "none", label: "Sem desconto" },
  { value: "percent", label: "Percentual (%)" },
  { value: "fixed", label: "Valor fixo (R$)" },
  { value: "courtesy", label: "Cortesia (100%)" },
];

// Tipo + valor do desconto. O valor só vale para % e R$; cortesia confirma a inscrição sem Pix.
function DiscountFields({ idPrefix, initial = NO_DISCOUNT }: { idPrefix: string; initial?: InviteDiscount }) {
  const [kind, setKind] = useState<DiscountKind>(initial.kind);
  const needsValue = kind === "percent" || kind === "fixed";
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${idPrefix}-kind`} className="text-body font-semibold">
          Desconto
        </label>
        <select id={`${idPrefix}-kind`} name="discountKind" value={kind} onChange={(e) => setKind(e.target.value as DiscountKind)} className="field">
          {kinds.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${idPrefix}-value`} className="text-body font-semibold">
          {kind === "fixed" ? "Valor (R$)" : "Valor (%)"}
        </label>
        <input
          id={`${idPrefix}-value`}
          name="discountValue"
          // muda a key ao trocar o tipo pra não levar "20" de % para R$
          key={kind}
          defaultValue={kind === initial.kind ? discountInputValue(initial) : ""}
          inputMode={kind === "fixed" ? "decimal" : "numeric"}
          disabled={!needsValue}
          required={needsValue}
          placeholder={kind === "fixed" ? "50,00" : kind === "percent" ? "20" : "—"}
          className="field disabled:opacity-50"
        />
      </div>
    </div>
  );
}

// Edição do desconto de um convite já criado (/admin/convites/[id]). Vale para as próximas inscrições.
export function InviteEditForm({ id, discount }: { id: string; discount: InviteDiscount }) {
  const [state, action, pending] = useActionState(updateInviteDiscountAction, { status: "idle" } as InviteFormState);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      <DiscountFields idPrefix="e-discount" initial={discount} />
      {state.message && (
        <p className="text-caption font-semibold" role="alert">
          — {state.message}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="border border-ink px-6 py-3 text-body transition-colors hover:bg-ink hover:text-paper dark:border-paper dark:hover:bg-paper dark:hover:text-ink disabled:cursor-not-allowed disabled:border-ash disabled:text-ink/50 disabled:hover:bg-transparent"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <Link href="/admin/convites" className="text-body underline underline-offset-4">
          Cancelar
        </Link>
      </div>
    </form>
  );
}

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
      <DiscountFields idPrefix="i-discount" />
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
