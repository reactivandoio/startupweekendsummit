"use client";

import { useActionState, useState } from "react";
import { createInviteAction, updateInviteAction, type InviteFormState } from "@/app/admin/actions";
import { Button, ButtonLink } from "@/components/button";
import { CopyButton } from "@/components/copy-button";
import { Select } from "@/components/select";
import { discountInputValue, isDiscountKind, NO_DISCOUNT, type DiscountKind, type InviteDiscount } from "@/lib/discounts";

const kinds = [
  { value: "none", label: "Sem desconto" },
  { value: "percent", label: "Percentual (%)" },
  { value: "fixed", label: "Valor fixo (R$)" },
  { value: "courtesy", label: "Cortesia (100%)" },
] as const;

type Editing = { id: string; name: string; email: string; note: string; maxUses: number; discount: InviteDiscount };

// Tipo + valor do desconto. O valor só vale para % e R$; cortesia vai sem Pix direto para a aprovação.
function DiscountFields({ initialKind, initialValue }: { initialKind: DiscountKind; initialValue: string }) {
  const [kind, setKind] = useState<DiscountKind>(initialKind);
  const needsValue = kind === "percent" || kind === "fixed";
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="i-discount-kind" className="text-body font-semibold">
          Desconto
        </label>
        <Select
          id="i-discount-kind"
          name="discountKind"
          options={kinds}
          defaultValue={initialKind}
          onChange={(v) => setKind(isDiscountKind(v) ? v : "none")}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="i-discount-value" className="text-body font-semibold">
          {kind === "fixed" ? "Valor (R$)" : "Valor (%)"}
        </label>
        <input
          id="i-discount-value"
          name="discountValue"
          // muda a key ao trocar o tipo pra não levar "20" de % para R$
          key={kind}
          defaultValue={kind === initialKind ? initialValue : ""}
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

// Criação (lista do painel) e edição (/admin/convites/[id]) com os mesmos campos e regras.
// Desconto e vagas editados valem para as próximas inscrições; as já feitas guardam o que tiveram.
export function InviteForm({ invite }: { invite?: Editing }) {
  const [state, action, pending] = useActionState(invite ? updateInviteAction : createInviteAction, { status: "idle" } as InviteFormState);
  const d = invite?.discount ?? NO_DISCOUNT;
  const v =
    state.status === "error" && state.values
      ? state.values
      : {
          name: invite?.name ?? "",
          email: invite?.email ?? "",
          note: invite?.note ?? "",
          maxUses: String(invite?.maxUses ?? 1),
          discountKind: d.kind,
          discountValue: discountInputValue(d),
        };
  const kind = isDiscountKind(v.discountKind) ? v.discountKind : "none";

  return (
    <form key={state.at ?? 0} action={action} className="flex flex-col gap-4">
      {invite && <input type="hidden" name="id" value={invite.id} />}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="i-name" className="text-body font-semibold">
          Nome do convidado
        </label>
        <input id="i-name" name="name" type="text" defaultValue={v.name} className="field" placeholder="Opcional — aparece na página do convite" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="i-email" className="text-body font-semibold">
          E-mail
        </label>
        <input id="i-email" name="email" type="email" defaultValue={v.email} className="field" placeholder="Opcional — pra enviar o link direto" />
      </div>
      <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="i-max" className="text-body font-semibold">
            Vagas
          </label>
          <input id="i-max" name="maxUses" type="number" min={1} max={500} defaultValue={v.maxUses} className="field" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="i-note" className="text-body font-semibold">
            Observação
          </label>
          <input id="i-note" name="note" type="text" defaultValue={v.note} className="field" placeholder="Ex.: comunidade SW Anápolis" />
        </div>
      </div>
      <DiscountFields initialKind={kind} initialValue={v.discountValue} />
      {!invite && (
        <label className="flex items-center gap-3 text-body">
          <input type="checkbox" name="send" defaultChecked className="h-4 w-4 accent-ink" />
          Enviar o convite por e-mail ao criar
        </label>
      )}
      {state.message && (
        <div className="flex flex-col gap-2" role={state.status === "error" ? "alert" : "status"}>
          <p className="text-caption font-semibold">— {state.message}</p>
          {state.url && (
            <div className="flex flex-wrap items-center gap-2">
              <code className="break-all font-mono text-caption">{state.url}</code>
              <CopyButton text={state.url} />
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {invite ? (pending ? "Salvando…" : "Salvar") : pending ? "Criando…" : "Criar convite"}
        </Button>
        {invite && <ButtonLink href="/admin/convites">Cancelar</ButtonLink>}
      </div>
    </form>
  );
}
