"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { registerParticipant, type RegistrationFieldErrors, type RegistrationFormState } from "@/app/inscricao/actions";
import { Button } from "@/components/button";
import { dateBrToIso, isValidCpf, isValidEmail, isValidIsoDate, isValidPhone, isoToDateBr, maskCpf, maskDateBr, maskPhone, normalizeEmail } from "@/lib/cpf";

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

const submitLabel = { pix: "Gerar Pix", checkout: "Ir para o pagamento", courtesy: "Confirmar inscrição" };
const pendingLabel = { pix: "Gerando o Pix…", checkout: "Abrindo o pagamento…", courtesy: "Confirmando…" };
const footnote = {
  pix: "Na próxima tela aparecem o QR Code e o Pix copia e cola, válidos por 1 hora.",
  checkout: "Pagamento seguro pelo Stripe. Você volta pra cá assim que concluir.",
  courtesy: "Ingresso cortesia: sem pagamento. A confirmação chega no seu e-mail.",
};

const linkClass = "underline decoration-grass decoration-2 underline-offset-4 hover:text-grass-deep";

// Formulário do convite: dados do participante → Pix do Opa Pingou, Checkout do Stripe ou cortesia (redireciona ao enviar).
// Máscaras no cliente (CPF, WhatsApp, data); o servidor recebe CPF/telefone como estão e guarda só dígitos,
// e a data já em YYYY-MM-DD (campo escondido). Validação no cliente antes do envio, com as mesmas regras do servidor.
export function RegistrationForm({ code, priceLabel, method }: { code: string; priceLabel: string; method: "pix" | "checkout" | "courtesy" }) {
  const [state, formAction, pending] = useActionState(registerParticipant, initialState);
  const v = state.values ?? {};
  const [cpf, setCpf] = useState(() => maskCpf(v.cpf ?? ""));
  const [phone, setPhone] = useState(() => maskPhone(v.phone ?? ""));
  const [email, setEmail] = useState(v.email ?? "");
  const [birth, setBirth] = useState(() => isoToDateBr(v.birthDate ?? ""));
  // controlado para não ser desmarcado quando o servidor devolve erro (a action reseta o formulário)
  const [sponsorConsent, setSponsorConsent] = useState(false);
  const [local, setLocal] = useState<RegistrationFieldErrors>({});
  const e = { ...(state.errors ?? {}), ...local };

  const validate = (form: HTMLFormElement): RegistrationFieldErrors => {
    const errors: RegistrationFieldErrors = {};
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    if (name.split(/\s+/).filter(Boolean).length < 2) errors.name = "Informe nome e sobrenome.";
    if (!isValidEmail(email)) errors.email = "Informe um e-mail válido, como nome@exemplo.com.";
    if (!isValidPhone(phone)) errors.phone = "Informe o WhatsApp com DDD: (62) 99999-9999.";
    if (!isValidCpf(cpf)) errors.cpf = "CPF inválido. Confira os 11 dígitos.";
    if (!isValidIsoDate(dateBrToIso(birth))) errors.birthDate = "Informe a data como dd/mm/aaaa.";
    if (!(form.elements.namedItem("consent") as HTMLInputElement).checked) errors.consent = "Precisamos do seu consentimento para concluir a inscrição.";
    return errors;
  };

  return (
    <form
      action={formAction}
      noValidate
      className="relative flex flex-col gap-8"
      onSubmit={(ev) => {
        const errors = validate(ev.currentTarget);
        setLocal(errors);
        if (Object.keys(errors).length > 0) {
          ev.preventDefault();
          const first = (["name", "email", "phone", "cpf", "birthDate", "consent"] as const).find((k) => errors[k]);
          const id = first === "birthDate" ? "birthDateBr" : first === "consent" ? "consent" : first;
          (ev.currentTarget.querySelector(`#${id}`) as HTMLElement | null)?.focus();
        }
      }}
    >
      {state.status === "error" && state.message && (
        <p className="border-2 border-ink bg-marigold-wash p-4 text-body font-semibold" role="alert">
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
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            value={email}
            onChange={(ev) => setEmail(ev.target.value.replace(/\s+/g, ""))}
            onBlur={() => setEmail((s) => normalizeEmail(s))}
            aria-invalid={!!e.email}
            className="field"
            placeholder="voce@exemplo.com"
          />
        </Field>
        <Field label="WhatsApp" htmlFor="phone" error={e.phone} hint="Com DDD. As orientações chegam por e-mail; o WhatsApp fica para o dia do evento.">
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            required
            maxLength={15}
            value={phone}
            onChange={(ev) => setPhone(maskPhone(ev.target.value))}
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
            value={cpf}
            onChange={(ev) => setCpf(maskCpf(ev.target.value))}
            aria-invalid={!!e.cpf}
            className="field"
            placeholder="000.000.000-00"
          />
        </Field>
        <Field label="Data de nascimento" htmlFor="birthDateBr" error={e.birthDate}>
          <input
            id="birthDateBr"
            type="text"
            inputMode="numeric"
            autoComplete="bday"
            required
            maxLength={10}
            value={birth}
            onChange={(ev) => setBirth(maskDateBr(ev.target.value))}
            aria-invalid={!!e.birthDate}
            className="field"
            placeholder="dd/mm/aaaa"
          />
          <input type="hidden" name="birthDate" value={dateBrToIso(birth)} />
        </Field>
      </div>

      <label className="flex items-start gap-3 text-body">
        <input id="consent" type="checkbox" name="consent" className="mt-1 h-4 w-4 accent-ink" required aria-invalid={!!e.consent} />
        <span>
          Autorizo o uso dos meus dados para a inscrição e a comunicação sobre o Techstars Startup Weekend Summit Brasil 2026,
          conforme os{" "}
          <Link href="/termos-de-uso" target="_blank" rel="noreferrer" className={linkClass}>
            Termos de Participação
          </Link>{" "}
          e a{" "}
          <Link href="/politica-de-privacidade" target="_blank" rel="noreferrer" className={linkClass}>
            Política de Privacidade
          </Link>
          .{e.consent && <span className="mt-1 block text-caption font-semibold">— {e.consent}</span>}
        </span>
      </label>

      {/* Consentimento separado e opcional (LGPD art. 7º, I e art. 8º): não pode vir embutido no aceite dos Termos */}
      <label className="-mt-4 flex items-start gap-3 text-body">
        <input
          id="sponsorConsent"
          type="checkbox"
          name="sponsorConsent"
          checked={sponsorConsent}
          onChange={(ev) => setSponsorConsent(ev.target.checked)}
          className="mt-1 h-4 w-4 accent-ink"
          aria-describedby="sponsorConsent-hint"
        />
        <span>
          Autorizo o compartilhamento do meu nome, e-mail e WhatsApp com os patrocinadores do evento, para que entrem em contato comigo
          sobre produtos, serviços e oportunidades, conforme a seção{" "}
          <Link href="/termos-de-uso#patrocinadores" target="_blank" rel="noreferrer" className={linkClass}>
            Compartilhamento de Dados com Patrocinadores
            <span className="sr-only"> (abre em nova aba)</span>
          </Link>{" "}
          dos Termos de Participação.
          <span id="sponsorConsent-hint" className="mt-1 block text-caption text-ink/60">
            Opcional: sem esta autorização sua inscrição segue normalmente. Você pode revogá-la quando quiser.
          </span>
        </span>
      </label>

      <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full">
        {pending ? pendingLabel[method] : `${submitLabel[method]} · ${method === "courtesy" ? "Cortesia" : priceLabel}`}
      </Button>
      <p className="text-caption text-ink/60">{footnote[method]}</p>
    </form>
  );
}
