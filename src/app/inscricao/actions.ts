"use server";

import { redirect } from "next/navigation";
import { isValidCpf, onlyDigits } from "@/lib/cpf";
import { getInviteByCode, inviteAvailable } from "@/lib/invites";
import { attachStripeSession, createRegistration, findPaidRegistration } from "@/lib/registrations";
import { appUrl, stripe, ticketConfig } from "@/lib/stripe";

export type RegistrationFieldErrors = Partial<Record<"name" | "email" | "phone" | "cpf" | "birthDate" | "consent", string>>;

export type RegistrationFormState = {
  status: "idle" | "error";
  message?: string;
  errors?: RegistrationFieldErrors;
  values?: Record<string, string>;
};

const SESSION_TTL_MIN = 60; // mínimo do Stripe é 30; igual à janela que segura a vaga do convite

function text(formData: FormData, key: string, max = 200) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

// Data de nascimento: YYYY-MM-DD real, no passado e depois de 1900
function validBirthDate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) return false;
  return d.getUTCFullYear() >= 1900 && d.getTime() < Date.now();
}

// Valida, cria a inscrição pendente e manda pro Checkout do Stripe. Em sucesso, redireciona (não retorna).
export async function registerParticipant(_prev: RegistrationFormState, formData: FormData): Promise<RegistrationFormState> {
  // Honeypot: bots preenchem; humanos não veem o campo.
  if (text(formData, "website")) return { status: "idle" };

  const code = text(formData, "code", 64);
  const name = text(formData, "name", 120);
  const email = text(formData, "email", 200).toLowerCase();
  const phone = onlyDigits(text(formData, "phone", 40));
  const cpf = onlyDigits(text(formData, "cpf", 20));
  const birthDate = text(formData, "birthDate", 10);
  const consent = formData.get("consent") === "on";
  const values = { name, email, phone: text(formData, "phone", 40), cpf: text(formData, "cpf", 20), birthDate };

  const errors: RegistrationFieldErrors = {};
  if (name.trim().split(/\s+/).length < 2) errors.name = "Informe nome e sobrenome.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Informe um e-mail válido.";
  if (phone.length < 10 || phone.length > 11) errors.phone = "Informe o WhatsApp com DDD.";
  if (!isValidCpf(cpf)) errors.cpf = "CPF inválido.";
  if (!validBirthDate(birthDate)) errors.birthDate = "Informe uma data válida.";
  if (!consent) errors.consent = "Precisamos do seu consentimento para concluir a inscrição.";
  if (Object.keys(errors).length > 0) return { status: "error", message: "Revise os campos destacados.", errors, values };

  const invite = code ? await getInviteByCode(code) : null;
  if (!invite || !inviteAvailable(invite)) {
    return { status: "error", message: "Este convite não está mais disponível. Fale com a organização.", values };
  }
  const ticket = ticketConfig();
  if (!ticket.enabled) {
    return { status: "error", message: "As inscrições ainda não estão abertas. Tente novamente em breve.", values };
  }
  if (await findPaidRegistration(email, cpf)) {
    return {
      status: "error",
      message: "Já existe uma inscrição confirmada com este e-mail ou CPF. Se precisar de ajuda, fale com a organização.",
      values,
    };
  }

  let checkoutUrl: string;
  try {
    const registration = await createRegistration({ inviteId: invite.id, name, email, phone, cpf, birthDate, amountCents: ticket.priceCents });
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      locale: "pt-BR",
      currency: "brl",
      customer_email: email,
      client_reference_id: registration.id,
      metadata: { registration_id: registration.id, invite_code: invite.code },
      line_items: [
        {
          quantity: 1,
          price_data: { currency: "brl", unit_amount: ticket.priceCents, product_data: { name: ticket.name } },
        },
      ],
      payment_intent_data: { description: `${ticket.name} — ${name}`, metadata: { registration_id: registration.id } },
      expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_MIN * 60,
      success_url: `${appUrl()}/inscricao/confirmada?s={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl()}/inscricao/${invite.code}?cancelado=1`,
    });
    if (!session.url) throw new Error("Checkout sem URL");
    await attachStripeSession(registration.id, session.id);
    checkoutUrl = session.url;
  } catch (err) {
    console.error("[registerParticipant]", err);
    return { status: "error", message: "Não conseguimos iniciar o pagamento agora. Tente novamente em instantes.", values };
  }
  redirect(checkoutUrl);
}
