"use client";

import { useActionState, useState } from "react";
import { saveCouponAction, type CouponFormState } from "@/app/admin/actions";
import { Button } from "@/components/button";
import { Select } from "@/components/select";

const kinds = [
  { value: "none", label: "Sem desconto (só rastreia)" },
  { value: "percent", label: "Percentual (%)" },
  { value: "fixed", label: "Valor fixo (R$)" },
] as const;

export type CouponEditing = {
  id: string;
  code: string;
  description: string;
  discountKind: "none" | "percent" | "fixed";
  discountValue: string;
  lotIds: string[];
  maxUses: string;
  startsAt: string; // datetime-local em Brasília
  endsAt: string;
  active: boolean;
};

// Criação (topo de /admin/cupons) e edição (em cada cupom da lista) com os mesmos campos e regras.
// Desconto: nenhum (só rastreia a origem), % (100% = inscrição gratuita) ou valor fixo. Lotes: todos ou os marcados.
export function CouponForm({ coupon, lots }: { coupon?: CouponEditing; lots: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(saveCouponAction, { status: "idle" } as CouponFormState);
  const v =
    state.status === "error" && state.values
      ? state.values
      : {
          code: coupon?.code ?? "",
          description: coupon?.description ?? "",
          discountKind: coupon?.discountKind ?? "none",
          discountValue: coupon?.discountValue ?? "",
          lotIds: coupon?.lotIds ?? [],
          maxUses: coupon?.maxUses ?? "",
          startsAt: coupon?.startsAt ?? "",
          endsAt: coupon?.endsAt ?? "",
          active: coupon?.active ?? true,
        };
  const [kind, setKind] = useState(v.discountKind);
  const [someLots, setSomeLots] = useState(v.lotIds.length > 0);
  const id = (k: string) => `c-${coupon?.id ?? "new"}-${k}`;
  const needsValue = kind === "percent" || kind === "fixed";

  return (
    <form key={state.at ?? 0} action={action} className="flex flex-col gap-4">
      {coupon && <input type="hidden" name="id" value={coupon.id} />}
      <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id("code")} className="text-body font-semibold">
            Código
          </label>
          <input
            id={id("code")}
            name="code"
            type="text"
            defaultValue={v.code}
            autoCapitalize="characters"
            spellCheck={false}
            className="field font-mono uppercase"
            placeholder="TRACK-GOIANIA"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id("desc")} className="text-body font-semibold">
            Descrição / track
          </label>
          <input id={id("desc")} name="description" type="text" defaultValue={v.description} className="field" placeholder="Ex.: comunidade de Anápolis" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id("kind")} className="text-body font-semibold">
            Desconto
          </label>
          <Select id={id("kind")} name="discountKind" options={kinds} defaultValue={kind} onChange={(k) => setKind(k === "percent" || k === "fixed" ? k : "none")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id("value")} className="text-body font-semibold">
            {kind === "fixed" ? "Valor (R$)" : "Valor (%)"}
          </label>
          <input
            id={id("value")}
            name="discountValue"
            // muda a key ao trocar o tipo pra não levar "20" de % para R$
            key={kind}
            defaultValue={kind === v.discountKind ? v.discountValue : ""}
            inputMode={kind === "fixed" ? "decimal" : "numeric"}
            disabled={!needsValue}
            required={needsValue}
            placeholder={kind === "fixed" ? "50,00" : kind === "percent" ? "20" : "—"}
            className="field disabled:opacity-50"
          />
        </div>
      </div>
      {kind === "percent" && <p className="-mt-2 text-caption text-ink/60">100% deixa a inscrição gratuita: sem cobrança, direto para a aprovação.</p>}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-body font-semibold">Vale nos lotes</legend>
        <label className="flex items-center gap-2 text-body">
          <input type="radio" name="lotScope" value="all" checked={!someLots} onChange={() => setSomeLots(false)} className="h-4 w-4 accent-ink" />
          Todos os lotes
        </label>
        <label className="flex items-center gap-2 text-body">
          <input type="radio" name="lotScope" value="some" checked={someLots} onChange={() => setSomeLots(true)} className="h-4 w-4 accent-ink" disabled={lots.length === 0} />
          Só nos lotes marcados
        </label>
        {someLots && (
          <div className="flex flex-wrap gap-x-5 gap-y-2 pl-6">
            {lots.map((l) => (
              <label key={l.id} className="flex items-center gap-2 text-body">
                <input type="checkbox" name="lotIds" value={l.id} defaultChecked={v.lotIds.includes(l.id)} className="h-4 w-4 accent-ink" />
                {l.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id("max")} className="text-body font-semibold">
            Limite de usos
          </label>
          <input id={id("max")} name="maxUses" type="number" min={1} defaultValue={v.maxUses} className="field" placeholder="Sem limite" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id("start")} className="text-body font-semibold">
            Válido de
          </label>
          <input id={id("start")} name="startsAt" type="datetime-local" defaultValue={v.startsAt} className="field" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id("end")} className="text-body font-semibold">
            Até
          </label>
          <input id={id("end")} name="endsAt" type="datetime-local" defaultValue={v.endsAt} className="field" />
        </div>
      </div>
      <p className="-mt-2 text-caption text-ink/60">Datas no horário de Brasília; vazias, o cupom vale enquanto estiver ativo.</p>

      {coupon && (
        <label className="flex items-center gap-2 text-body">
          <input type="checkbox" name="active" defaultChecked={v.active} className="h-4 w-4 accent-ink" />
          Ativo
        </label>
      )}
      {state.message && (
        <p className="text-caption font-semibold" role={state.status === "error" ? "alert" : "status"}>
          — {state.message}
        </p>
      )}
      <Button type="submit" variant={coupon ? "secondary" : "primary"} size={coupon ? "sm" : "md"} disabled={pending} className="self-start">
        {coupon ? (pending ? "Salvando…" : "Salvar cupom") : pending ? "Criando…" : "Criar cupom"}
      </Button>
    </form>
  );
}
