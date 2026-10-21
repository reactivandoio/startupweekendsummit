"use server";

import { redirect } from "next/navigation";
import { isValidCpf, isValidIsoDate, isValidPhone, normalizeEmail, onlyDigits } from "@/lib/cpf";
import { getInviteByCode, inviteAvailable } from "@/lib/invites";
import { createCharge } from "@/lib/opapingou";
import { attachOpaCharge, attachStripeSession, createRegistration, deleteUnpaidRegistration, findPaidRegistration } from "@/lib/registrations";
import { appUrl, stripe } from "@/lib/stripe";
import { currentOffer } from "@/lib/tickets";

export type RegistrationFieldErrors = Partial<Record<"name" | "email" | "phone" | "cpf" | "birthDate" | "consent", string>>;

export type RegistrationFormState = {
  status: "idle" | "error";
  message?: string;
  errors?: RegistrationFieldErrors;
  values?: Record<string, string>;
};

const SESSION_TTL_MIN = 60; // mínimo do Stripe é 30; igual à janela que segura a vaga do convite (e à cobrança Pix ONE_HOUR)

function text(formData: FormData, key: string, max = 200) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

// Valida, cria a inscrição pendente e manda pro pagamento: Pix do Opa Pingou (página com QR) ou Checkout do Stripe.
// Em sucesso, redireciona (não retorna).
export async function registerParticipant(_prev: RegistrationFormState, formData: FormData): Promise<RegistrationFormState> {
  // Honeypot: bots preenchem; humanos não veem o campo.
  if (text(formData, "website")) return { status: "idle" };

  const code = text(formData, "code", 64);
  const name = text(formData, "name", 120);
  const email = normalizeEmail(text(formData, "email", 200));
  const phone = onlyDigits(text(formData, "phone", 40));
  const cpf = onlyDigits(text(formData, "cpf", 20));
  const birthDate = text(formData, "birthDate", 10);
  const consent = formData.get("consent") === "on";
  const values = { name, email, phone: text(formData, "phone", 40), cpf: text(formData, "cpf", 20), birthDate };

  const errors: RegistrationFieldErrors = {};
  if (name.trim().split(/\s+/).length < 2) errors.name = "Informe nome e sobrenome.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Informe um e-mail válido.";
  if (!isValidPhone(phone)) errors.phone = "Informe o WhatsApp com DDD.";
  if (!isValidCpf(cpf)) errors.cpf = "CPF inválido.";
  if (!isValidIsoDate(birthDate)) errors.birthDate = "Informe uma data válida.";
  if (!consent) errors.consent = "Precisamos do seu consentimento para concluir a inscrição.";
  if (Object.keys(errors).length > 0) return { status: "error", message: "Revise os campos destacados.", errors, values };

  const invite = code ? await getInviteByCode(code) : null;
  if (!invite || !inviteAvailable(invite)) {
    return { status: "error", message: "Este convite não está mais disponível. Fale com a organização.", values };
  }
  const ticket = await currentOffer();
  if (!ticket.enabled) {
    const message = ticket.reason === "sold_out" ? "Os ingressos deste lote esgotaram. Fale com a organização." : "As inscrições ainda não estão abertas. Tente novamente em breve.";
    return { status: "error", message, values };
  }
  if (await findPaidRegistration(email, cpf)) {
    return {
      status: "error",
      message: "Já existe uma inscrição confirmada com este e-mail ou CPF. Se precisar de ajuda, fale com a organização.",
      values,
    };
  }

  const registration = await createRegistration({
    inviteId: invite.id,
    name,
    email,
    phone,
    cpf,
    birthDate,
    amountCents: ticket.priceCents,
    provider: ticket.provider,
    lotId: ticket.lotId,
  });

  let next: string;
  try {
    if (ticket.provider === "opapingou") {
      const charge = await createCharge(registration.id, ticket.priceCents, `${ticket.name} — ${name}`);
      if (!charge.brCode) throw new Error(`Cobrança ${charge.id} sem copia e cola`);
      await attachOpaCharge(registration.id, charge);
      next = `/inscricao/pix/${registration.id}`;
    } else {
      next = await stripeCheckout(registration.id, invite.code, email, name, ticket.priceCents, ticket.name);
    }
  } catch (err) {
    console.error("[registerParticipant]", err);
    // sem cobrança, a inscrição pendente só seguraria a vaga à toa
    await deleteUnpaidRegistration(registration.id).catch(() => {});
    return { status: "error", message: "Não conseguimos iniciar o pagamento agora. Tente novamente em instantes.", values };
  }
  redirect(next);
}

async function stripeCheckout(registrationId: string, inviteCode: string, email: string, name: string, priceCents: number, productName: string) {
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    locale: "pt-BR",
    currency: "brl",
    customer_email: email,
    client_reference_id: registrationId,
    metadata: { registration_id: registrationId, invite_code: inviteCode },
    line_items: [
      {
        quantity: 1,
        price_data: { currency: "brl", unit_amount: priceCents, product_data: { name: productName } },
      },
    ],
    payment_intent_data: { description: `${productName} — ${name}`, metadata: { registration_id: registrationId } },
    expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_MIN * 60,
    success_url: `${appUrl()}/inscricao/confirmada?s={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/inscricao/${inviteCode}?cancelado=1`,
  });
  if (!session.url) throw new Error("Checkout sem URL");
  await attachStripeSession(registrationId, session.id);
  return session.url;
}
