"use client";

import { useActionState } from "react";
import { requestLogin, type LoginState } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(requestLogin, { status: "idle" } as LoginState);

  if (state.status === "sent") {
    return (
      <p className="border border-paper p-4 text-body-md" role="status">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <label htmlFor="email" className="text-body font-semibold">
        E-mail
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        autoFocus
        className="w-full border border-paper bg-transparent p-4 text-body-md text-paper outline-none placeholder:text-paper/40"
        placeholder="voce@exemplo.com"
      />
      {state.status === "error" && (
        <p className="text-caption font-semibold" role="alert">
          — {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex h-16 items-center justify-center border border-paper text-subheading transition-colors hover:bg-paper hover:text-obsidian disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-paper"
      >
        {pending ? "Enviando…" : "Receber link de acesso"}
      </button>
    </form>
  );
}
