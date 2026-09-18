"use client";

import { useActionState } from "react";
import { createUser, type UserFormState } from "@/app/admin/actions";

export function UserForm() {
  const [state, action, pending] = useActionState(createUser, { status: "idle" } as UserFormState);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="u-name" className="text-body font-semibold">
          Nome
        </label>
        <input id="u-name" name="name" type="text" className="field" placeholder="Opcional" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="u-email" className="text-body font-semibold">
          E-mail
        </label>
        <input id="u-email" name="email" type="email" required className="field" placeholder="pessoa@exemplo.com" />
      </div>
      {state.message && (
        <p className="text-caption font-semibold" role="status">
          — {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start border border-ink px-6 py-3 text-body transition-colors hover:bg-ink hover:text-paper dark:border-paper dark:hover:bg-paper dark:hover:text-ink disabled:cursor-not-allowed disabled:border-ash disabled:text-ink/50 disabled:hover:bg-transparent"
      >
        {pending ? "Adicionando…" : "Dar acesso"}
      </button>
    </form>
  );
}
