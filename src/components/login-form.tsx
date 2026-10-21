"use client";

import { useActionState } from "react";
import { requestLogin, type LoginState } from "@/app/admin/actions";
import { Button } from "@/components/button";

export function LoginForm() {
  const [state, action, pending] = useActionState(requestLogin, { status: "idle" } as LoginState);

  if (state.status === "sent") {
    return (
      <p className="border-2 border-ink bg-grass-wash p-6 text-body-md shadow-hard" role="status">
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
        aria-invalid={state.status === "error" || undefined}
        className="field"
        placeholder="voce@exemplo.com"
      />
      {state.status === "error" && (
        <p className="text-caption font-semibold" role="alert">
          — {state.message}
        </p>
      )}
      <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full">
        {pending ? "Enviando…" : "Receber link de acesso"}
      </Button>
    </form>
  );
}
