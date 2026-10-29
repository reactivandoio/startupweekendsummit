"use client";

import { useActionState } from "react";
import { switchPaymentMethod, type SwitchPaymentState } from "@/app/inscricao/actions";
import { buttonClass } from "@/components/button";

const idle: SwitchPaymentState = { status: "idle" };

// Troca Pix ↔ cartão na página de pagamento: nova cobrança na mesma inscrição (a vaga continua reservada)
export function SwitchPayment({ id, to, title, text }: { id: string; to: "pix" | "card"; title: string; text: string }) {
  const [state, action, pending] = useActionState(switchPaymentMethod, idle);
  return (
    <form action={action} className="flex flex-col gap-3 border-t border-ash pt-6">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="method" value={to} />
      <p className="text-body font-semibold">{title}</p>
      <p className="text-body">{text}</p>
      {state.message && (
        <p className="text-caption font-semibold" role="alert">
          — {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className={buttonClass("secondary", "md", "self-start")}>
        {pending ? (to === "card" ? "Abrindo o cartão…" : "Gerando o Pix…") : to === "card" ? "Pagar com cartão de crédito" : "Pagar com Pix"}
      </button>
    </form>
  );
}
