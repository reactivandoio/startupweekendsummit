"use client";

import { useActionState } from "react";
import { registerVolunteer, type FormState } from "@/app/actions";
import { availabilityOptions, volunteerAreas } from "@/content/site";

const initialState: FormState = { status: "idle" };

// Opções selecionáveis: borda grafite que vira chalk quando marcada — sem cor de estado
const choiceClass =
  "flex cursor-pointer items-center gap-3 border border-graphite p-3 text-caption transition-colors has-checked:border-chalk";

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-caption">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-caption text-chalk/60">{hint}</p>}
      {error && (
        <p className="text-caption" role="alert">
          — {error}
        </p>
      )}
    </div>
  );
}

export function VolunteerForm() {
  const [state, formAction, pending] = useActionState(registerVolunteer, initialState);
  const v = state.values ?? {};
  const e = state.errors ?? {};

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-3 border border-chalk p-6" role="status">
        <p className="font-mono text-caption tracking-normal">OK</p>
        <h3 className="text-heading">Inscrição recebida.</h3>
        <p className="text-body">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="relative flex flex-col gap-6">
      {state.status === "error" && state.message && (
        <p className="border border-chalk p-3 text-caption" role="alert">
          — {state.message}
        </p>
      )}

      {/* honeypot */}
      <div className="absolute -left-[9999px] top-0" aria-hidden="true">
        <label>
          Não preencha este campo
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Field label="Nome completo" htmlFor="name" error={e.name}>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          defaultValue={v.name}
          aria-invalid={!!e.name}
          className="field"
          placeholder="Como devemos te chamar?"
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="E-mail" htmlFor="email" error={e.email}>
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
        <Field label="WhatsApp" htmlFor="phone" error={e.phone} hint="Com DDD. É por aqui que falamos com você.">
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            defaultValue={v.phone}
            aria-invalid={!!e.phone}
            className="field"
            placeholder="(62) 99999-9999"
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Cidade" htmlFor="city" error={e.city}>
          <input
            id="city"
            name="city"
            type="text"
            autoComplete="address-level2"
            required
            defaultValue={v.city}
            aria-invalid={!!e.city}
            className="field"
            placeholder="Goiânia"
          />
        </Field>
        <Field label="Área de interesse" htmlFor="area" error={e.area}>
          <select
            id="area"
            name="area"
            required
            defaultValue={v.area ?? ""}
            aria-invalid={!!e.area}
            className="field"
          >
            <option value="" disabled>
              Selecione…
            </option>
            {volunteerAreas.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-caption">Disponibilidade</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {availabilityOptions.map((o) => (
            <label key={o.value} className={choiceClass}>
              <input type="checkbox" name="availability" value={o.value} className="h-4 w-4 accent-chalk" />
              {o.label}
            </label>
          ))}
        </div>
        {e.availability && (
          <p className="text-caption" role="alert">
            — {e.availability}
          </p>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-caption">Já foi voluntário em algum evento?</legend>
        <div className="flex gap-3">
          {[
            { value: "sim", label: "Sim" },
            { value: "nao", label: "Ainda não" },
          ].map((o) => (
            <label key={o.value} className={choiceClass}>
              <input
                type="radio"
                name="experience"
                value={o.value}
                defaultChecked={(v.experience ?? "nao") === o.value}
                className="h-4 w-4 accent-chalk"
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Por que você quer ser voluntário?" htmlFor="motivation" hint="Opcional, mas adoramos ler.">
        <textarea
          id="motivation"
          name="motivation"
          rows={4}
          maxLength={1000}
          defaultValue={v.motivation}
          className="field"
          placeholder="Conta pra gente o que te anima nessa ideia."
        />
      </Field>

      <label className="flex items-start gap-3 text-caption">
        <input type="checkbox" name="consent" className="mt-1 h-4 w-4 accent-chalk" required />
        <span>
          Autorizo o uso dos meus dados para contato sobre o voluntariado no Startup Weekend Summit.
          {e.consent && <span className="mt-1 block">— {e.consent}</span>}
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="self-start bg-paper p-3 text-caption uppercase text-obsidian transition-colors hover:bg-chalk disabled:cursor-not-allowed disabled:bg-graphite disabled:text-chalk"
      >
        {pending ? "Enviando…" : "Quero ser voluntário"}
      </button>
    </form>
  );
}
