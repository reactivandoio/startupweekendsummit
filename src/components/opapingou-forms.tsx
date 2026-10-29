"use client";

import { useActionState } from "react";
import { createLotAction, deleteDuplicateOpaWebhook, saveCardAccount, saveOpaKey, setupOpaWebhook, testOpaWebhook, updateLotAction, type OpaFormState } from "@/app/admin/actions";
import { buttonClass } from "@/components/button";

const idle: OpaFormState = { status: "idle" };
const primary = buttonClass("primary", "md", "self-start");
const secondary = buttonClass("secondary", "sm");

const Message = ({ state }: { state: OpaFormState }) =>
  state.message ? (
    <p className="text-caption font-semibold" role="status">
      — {state.message}
    </p>
  ) : null;

// Campo da chave: nunca é preenchido com a chave salva (ela não volta pro navegador)
export function OpaKeyForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(saveOpaKey, idle);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="opa-key" className="text-body font-semibold">
          {configured ? "Trocar a chave de API" : "Chave de API"}
        </label>
        <input id="opa-key" name="apiKey" type="password" autoComplete="off" spellCheck={false} className="field font-mono" placeholder="opk_live_… ou opk_test_…" required />
        <p className="text-caption text-ink/60">Escopos necessários: charges:write, charges:read, webhooks:read e webhooks:write. Opcional: payments:read, para gravar se o link do cartão foi pago no cartão ou no Pix.</p>
      </div>
      <Message state={state} />
      <button type="submit" disabled={pending} className={primary}>
        {pending ? "Validando…" : "Salvar chave"}
      </button>
    </form>
  );
}

export function OpaWebhookButtons({ registered }: { registered: boolean }) {
  const [setupState, setup, settingUp] = useActionState(setupOpaWebhook, idle);
  const [testState, test, testing] = useActionState(testOpaWebhook, idle);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <form action={setup}>
          <button type="submit" disabled={settingUp} className={secondary}>
            {settingUp ? "Aguarde…" : registered ? "Trocar segredo" : "Cadastrar webhook"}
          </button>
        </form>
        {registered && (
          <form action={test}>
            <button type="submit" disabled={testing} className={secondary}>
              {testing ? "Enviando…" : "Enviar teste"}
            </button>
          </form>
        )}
      </div>
      <Message state={setupState.message ? setupState : testState} />
    </div>
  );
}

// Excluir um cadastro duplicado da URL do site no Opa Pingou (não tem volta, por isso confirma)
export function OpaDuplicateWebhookDelete({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteDuplicateOpaWebhook, idle);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className={buttonClass("secondary", "sm", "self-start")}
        onClick={(e) => {
          if (!window.confirm(`Excluir no Opa Pingou o webhook ${id}? O cadastro salvo neste site continua.`)) e.preventDefault();
        }}
      >
        {pending ? "Excluindo…" : "Excluir"}
      </button>
      <Message state={state} />
    </form>
  );
}

// Lote: nome, valor, quantidade (opcional) e período de vendas (opcional, horário de Brasília).
// Sem lot: cria (e limpa o formulário depois); com lot: edita, com o liga/desliga.
export function LotForm({ lot }: { lot?: { id: string; name: string; price: string; quantity: number | null; startsAt: string; endsAt: string; active: boolean } }) {
  const [state, action, pending] = useActionState(lot ? updateLotAction : createLotAction, idle);
  const id = (k: string) => `lot-${lot?.id ?? "new"}-${k}`;
  return (
    <form action={action} className="flex flex-col gap-4">
      {lot && <input type="hidden" name="id" value={lot.id} />}
      <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id("name")} className="text-body font-semibold">
            Nome do lote
          </label>
          <input id={id("name")} name="name" type="text" defaultValue={lot?.name} className="field" placeholder="Ex.: 1º lote" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id("price")} className="text-body font-semibold">
            Valor (R$)
          </label>
          <input id={id("price")} name="price" type="text" inputMode="decimal" defaultValue={lot?.price} className="field" placeholder="350,00" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id("qty")} className="text-body font-semibold">
            Quantidade
          </label>
          <input id={id("qty")} name="quantity" type="number" min={0} defaultValue={lot?.quantity ?? ""} className="field" placeholder="Sem limite" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id("start")} className="text-body font-semibold">
            Início das vendas
          </label>
          <input id={id("start")} name="startsAt" type="datetime-local" defaultValue={lot?.startsAt} className="field" />
          <p className="text-caption text-ink/60">Horário de Brasília. Vazio: já começa.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id("end")} className="text-body font-semibold">
            Fim das vendas
          </label>
          <input id={id("end")} name="endsAt" type="datetime-local" defaultValue={lot?.endsAt} className="field" />
          <p className="text-caption text-ink/60">Horário de Brasília. Vazio: até esgotar.</p>
        </div>
      </div>
      {lot && (
        <label className="flex items-center gap-2 text-body">
          <input type="checkbox" name="active" defaultChecked={lot.active} className="h-4 w-4 accent-ink" />
          Ativo
        </label>
      )}
      <Message state={state} />
      <button type="submit" disabled={pending} className={lot ? `${secondary} self-start` : primary}>
        {pending ? (lot ? "Salvando…" : "Criando…") : lot ? "Salvar lote" : "Criar lote"}
      </button>
    </form>
  );
}

// Conta Abacate Pay dos links de pagamento (cartão). Não é segredo: o id salvo volta preenchido.
export function CardAccountForm({ accountId }: { accountId: string | null }) {
  const [state, action, pending] = useActionState(saveCardAccount, idle);
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-caption">
        Conta Abacate Pay (bankAccountId)
        <input name="accountId" defaultValue={accountId ?? ""} spellCheck={false} autoComplete="off" className="field font-mono" placeholder="Vazio: conta padrão de links" />
      </label>
      <Message state={state} />
      <button type="submit" disabled={pending} className={`${secondary} self-start`}>
        {pending ? "Salvando…" : "Salvar conta"}
      </button>
    </form>
  );
}
