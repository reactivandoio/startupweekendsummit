"use client";

import { useActionState } from "react";
import { createUser, type UserFormState } from "@/app/admin/actions";
import { buttonClass } from "@/components/button";

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
        className={buttonClass("primary", "md", "self-start")}
      >
        {pending ? "Adicionando…" : "Dar acesso"}
      </button>
    </form>
  );
}
