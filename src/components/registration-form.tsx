"use client";

import { useActionState } from "react";
import { registerParticipant, type RegistrationFormState } from "@/app/inscricao/actions";

const initialState: RegistrationFormState = { status: "idle" };

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-body font-semibold">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-caption text-ink/60">{hint}</p>}
      {error && (
        <p className="text-caption font-semibold" role="alert">
          — {error}
        </p>
      )}
    </div>
  );
}

// Formulário do convite: dados do participante → Checkout do Stripe (redireciona ao enviar)
export function RegistrationForm({ code, priceLabel }: { code: string; priceLabel: string }) {
  const [state, formAction, pending] = useActionState(registerParticipant, initialState);
  const v = state.values ?? {};
  const e = state.errors ?? {};

  return (
    <form action={formAction} noValidate className="relative flex flex-col gap-8">
      {state.status === "error" && state.message && (
        <p className="border border-ink p-4 text-body font-semibold" role="alert">
          — {state.message}
        </p>
      )}

      <input type="hidden" name="code" value={code} />

      {/* honeypot */}
      <div className="absolute -left-[9999px] top-0" aria-hidden="true">
        <label>
          Não preencha este campo
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Field label="Nome completo" htmlFor="name" error={e.name} hint="Como vai aparecer no seu crachá.">
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          defaultValue={v.name}
          aria-invalid={!!e.name}
          className="field"
          placeholder="Nome e sobrenome"
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="E-mail" htmlFor="email" error={e.email} hint="Enviamos a confirmação e o comprovante aqui.">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={v.email}
            aria-invalid={!!e.email}
            className="field"
            placeholder="voce@exemplo.com"
          />
        </Field>
        <Field label="WhatsApp" htmlFor="phone" error={e.phone} hint="Com DDD. As orientações do evento chegam por aqui.">
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="numeric"
            required
            defaultValue={v.phone}
            aria-invalid={!!e.phone}
            className="field"
            placeholder="(62) 99999-9999"
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="CPF" htmlFor="cpf" error={e.cpf}>
          <input
            id="cpf"
            name="cpf"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            required
            maxLength={14}
            defaultValue={v.cpf}
            aria-invalid={!!e.cpf}
            className="field"
            placeholder="000.000.000-00"
          />
        </Field>
        <Field label="Data de nascimento" htmlFor="birthDate" error={e.birthDate}>
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            autoComplete="bday"
            required
            min="1900-01-01"
            defaultValue={v.birthDate}
            aria-invalid={!!e.birthDate}
            className="field"
          />
        </Field>
      </div>

      <label className="flex items-start gap-3 text-body">
        <input type="checkbox" name="consent" className="mt-1 h-4 w-4 accent-ink" required />
        <span>
          Autorizo o uso dos meus dados para a inscrição e a comunicação sobre o Techstars Startup Weekend Summit Brasil 2026.
          {e.consent && <span className="mt-1 block text-caption font-semibold">— {e.consent}</span>}
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="flex h-16 w-full items-center justify-center border border-ink text-subheading text-ink transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:border-ash disabled:text-ink/50 disabled:hover:bg-transparent"
      >
        {pending ? "Abrindo o pagamento…" : `Ir para o pagamento · ${priceLabel}`}
      </button>
      <p className="text-caption text-ink/60">Pagamento seguro pelo Stripe. Você volta pra cá assim que concluir.</p>
    </form>
  );
}
