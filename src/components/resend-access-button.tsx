"use client";

import { useActionState } from "react";
import { resendAccessInvite, type UserFormState } from "@/app/admin/actions";
import { buttonClass } from "@/components/button";

// Reenvia o convite de acesso e diz o que aconteceu: o problema que este botão
// resolve é justamente o de não saber se o e-mail chegou.
export function ResendAccessButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(resendAccessInvite, { status: "idle" } as UserFormState);
  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="id" value={id} />
      {state.message && (
        <span className="max-w-[22ch] text-caption" role="status" aria-live="polite">
          {state.message}
        </span>
      )}
      <button
        type="submit"
        disabled={pending}
        className={buttonClass("secondary", "sm")}
      >
        {pending ? "Enviando…" : "Reenviar convite"}
      </button>
    </form>
  );
}
