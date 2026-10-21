"use client";

import { useActionState } from "react";
import { createLotAction, saveOpaKey, setupOpaWebhook, testOpaWebhook, type OpaFormState } from "@/app/admin/actions";
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
        <p className="text-caption text-ink/60 dark:text-paper/60">Escopos necessários: charges:write, charges:read, webhooks:read e webhooks:write.</p>
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

export function LotForm() {
  const [state, action, pending] = useActionState(createLotAction, idle);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lot-name" className="text-body font-semibold">
          Nome do lote
        </label>
        <input id="lot-name" name="name" type="text" className="field" placeholder="Ex.: 1º lote" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lot-price" className="text-body font-semibold">
            Valor (R$)
          </label>
          <input id="lot-price" name="price" type="text" inputMode="decimal" className="field" placeholder="350,00" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lot-qty" className="text-body font-semibold">
            Quantidade
          </label>
          <input id="lot-qty" name="quantity" type="number" min={0} className="field" placeholder="Sem limite" />
        </div>
      </div>
      <Message state={state} />
      <button type="submit" disabled={pending} className={primary}>
        {pending ? "Criando…" : "Criar lote"}
      </button>
    </form>
  );
}
