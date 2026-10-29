"use server";

import { redirect } from "next/navigation";
import { site } from "@/content/site";
import { isValidCpf, isValidIsoDate, isValidPhone, normalizeEmail, onlyDigits } from "@/lib/cpf";
import { NO_DISCOUNT } from "@/lib/discounts";
import { getInviteByCode, inviteAvailable, type Invite } from "@/lib/invites";
import { sendPaymentReceived } from "@/lib/mail";
import { holdsSeat, resumePlan } from "@/lib/payment-flow";
import { formPath, paymentPagePath } from "@/lib/registration-state";
import {
  attachStripeSession,
  createRegistration,
  deleteUnpaidRegistration,
  findPaidRegistration,
  findResumableRegistration,
  getRegistration,
  markPaid,
  updateRegistrationData,
} from "@/lib/registrations";
import { cardPaymentEnabled, openRegistrationEnabled } from "@/lib/settings";
import { appUrl, stripe } from "@/lib/stripe";
import { startOpaPayment } from "@/lib/ticket-payments";
import { currentOffer, offerPrice } from "@/lib/tickets";

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

// Valida, cria a inscrição pendente e manda pro pagamento: Pix do Opa Pingou (página com QR), cartão de crédito pelo
// link de pagamento do Opa Pingou (página "aguardando pagamento") ou Checkout do Stripe.
// Cortesia (desconto do convite cobre o lote): confirma direto, sem cobrança. Em sucesso, redireciona (não retorna).
// mode=open: cadastro aberto, sem convite; mesma cobrança, mas a inscrição paga fica aguardando aprovação no painel.
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
  const sponsorConsent = formData.get("sponsorConsent") === "on"; // opcional: não bloqueia a inscrição
  const values = { name, email, phone: text(formData, "phone", 40), cpf: text(formData, "cpf", 20), birthDate };

  const errors: RegistrationFieldErrors = {};
  if (name.trim().split(/\s+/).length < 2) errors.name = "Informe nome e sobrenome.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Informe um e-mail válido.";
  if (!isValidPhone(phone)) errors.phone = "Informe o WhatsApp com DDD.";
  if (!isValidCpf(cpf)) errors.cpf = "CPF inválido.";
  if (!isValidIsoDate(birthDate)) errors.birthDate = "Informe uma data válida.";
  if (!consent) errors.consent = "Precisamos do seu consentimento para concluir a inscrição.";
  if (Object.keys(errors).length > 0) return { status: "error", message: "Revise os campos destacados.", errors, values };

  // Cadastro aberto (/inscricao/aberta): sem convite e sem desconto; paga e entra em análise
  const open = formData.get("mode") === "open";
  const source = open ? "open" : "invite";
  let invite: Invite | null = null;
  if (open) {
    if (!(await openRegistrationEnabled())) {
      return { status: "error", message: "As inscrições por esta página estão fechadas no momento. Fale com a organização.", values };
    }
  } else {
    invite = code ? await getInviteByCode(code) : null;
    if (!invite || invite.revokedAt) {
      return { status: "error", message: "Este convite não está mais disponível. Fale com a organização.", values };
    }
  }
  // Só bloqueia quem já pagou; pendente (abandonou o Pix ou o cartão no meio) é retomada logo abaixo
  if (await findPaidRegistration(email, cpf)) {
    return {
      status: "error",
      message: `Você já tem uma inscrição paga com este e-mail ou CPF: o ingresso (ou o aviso de que ela está em análise) foi para o e-mail cadastrado. Não encontrou ou precisa mudar algo? Fale com a organização em ${site.contactEmail}.`,
      values,
    };
  }

  const ticket = await currentOffer();
  const chosen = formData.get("paymentMethod") === "card" && (await cardPaymentEnabled()) ? "card" : "pix";
  const description = (r: { name: string }) => `${ticket.name} — ${r.name}`;
  const person = { name, email, phone, cpf, birthDate, sponsorConsent };
  // Mesmo convite (ou cadastro aberto) e mesma pessoa, ainda não paga: retoma a mesma inscrição em vez de criar outra
  const resumable = ticket.enabled && ticket.provider !== "opapingou" ? null : await findResumableRegistration({ source, inviteId: invite?.id ?? null, email, cpf });
  const failMessage = (card: boolean) =>
    card ? "Não conseguimos abrir o pagamento com cartão agora. Tente novamente em instantes ou escolha Pix." : "Não conseguimos iniciar o pagamento agora. Tente novamente em instantes.";

  // A vaga ainda é dela (cobrança valendo): segue com o mesmo preço, mesmo com o lote "esgotado" por ela mesma.
  // Mesmo meio: volta para a página da cobrança; outro meio: nova cobrança na mesma inscrição.
  if (resumable && holdsSeat(resumable)) {
    await updateRegistrationData(resumable.id, person);
    let next = paymentPagePath(resumable);
    if (resumePlan(resumable, chosen) === "new_charge") {
      try {
        next = await startOpaPayment(resumable, chosen, description({ name }));
      } catch (err) {
        console.error("[registerParticipant] retomada", err);
        return { status: "error", message: failMessage(chosen === "card"), values: { ...values, paymentMethod: chosen } };
      }
    }
    redirect(next);
  }

  if (invite && !inviteAvailable(invite)) {
    return { status: "error", message: "Este convite não está mais disponível. Fale com a organização.", values };
  }
  if (!ticket.enabled) {
    const message = ticket.reason === "sold_out" ? "Os ingressos deste lote esgotaram. Fale com a organização." : "As inscrições ainda não estão abertas. Tente novamente em breve.";
    return { status: "error", message, values };
  }

  const price = offerPrice(ticket, invite?.discount ?? NO_DISCOUNT);

  // Inscrição não paga cuja cobrança venceu: a vaga é disputada de novo (checada acima); preço do lote de agora
  if (resumable && !price.courtesy && ticket.provider === "opapingou") {
    await updateRegistrationData(resumable.id, {
      ...person,
      price: { amountCents: price.finalCents, listPriceCents: price.listCents, discountCents: price.discountCents, lotId: ticket.lotId },
    });
    let next: string;
    try {
      next = await startOpaPayment({ id: resumable.id, amountCents: price.finalCents }, chosen, description({ name }));
    } catch (err) {
      console.error("[registerParticipant] retomada", err);
      return { status: "error", message: failMessage(chosen === "card"), values: { ...values, paymentMethod: chosen } };
    }
    redirect(next);
  }

  const registration = await createRegistration({
    inviteId: invite?.id ?? null,
    source,
    name,
    email,
    phone,
    cpf,
    birthDate,
    amountCents: price.finalCents,
    listPriceCents: price.listCents,
    discountCents: price.discountCents,
    provider: price.courtesy ? "courtesy" : ticket.provider,
    lotId: ticket.lotId,
    sponsorConsent,
  });

  if (price.courtesy) {
    const paid = await markPaid(registration.id, null, 0);
    if (paid) await sendPaymentReceived(paid).catch((err) => console.error("[registerParticipant] mail", err));
    redirect(`/inscricao/confirmada?r=${registration.id}`);
  }

  // Cartão só quando escolhido e ligado no painel; mesmo valor do Pix (a tarifa do cartão não é repassada)
  const card = ticket.provider === "opapingou" && chosen === "card";
  let next: string;
  try {
    if (ticket.provider === "opapingou") {
      next = await startOpaPayment(registration, chosen, description({ name }));
    } else {
      const inviteCode = invite?.code ?? "";
      next = await stripeCheckout(registration.id, inviteCode, formPath({ source: registration.source, inviteCode }), email, name, price.finalCents, ticket.name);
    }
  } catch (err) {
    console.error("[registerParticipant]", err);
    // sem cobrança, a inscrição pendente só seguraria a vaga à toa
    await deleteUnpaidRegistration(registration.id).catch(() => {});
    return { status: "error", message: failMessage(card), values: { ...values, paymentMethod: chosen } };
  }
  redirect(next);
}

export type SwitchPaymentState = { status: "idle" | "error"; message?: string };

// "Prefere pagar com cartão/Pix?" nas páginas de pagamento: nova cobrança do outro meio na mesma inscrição, enquanto
// ela ainda segura a vaga. Depois do prazo, a pessoa volta ao formulário (que retoma a inscrição e confere a vaga).
// O id é o da inscrição (uuid), o mesmo da URL da página.
export async function switchPaymentMethod(_prev: SwitchPaymentState, formData: FormData): Promise<SwitchPaymentState> {
  const id = String(formData.get("id") ?? "");
  const method = formData.get("method") === "card" ? "card" : "pix";
  const reg = /^[0-9a-f-]{36}$/i.test(id) ? await getRegistration(id) : null;
  if (!reg || reg.provider !== "opapingou" || reg.status === "paid") redirect(reg ? `/inscricao/confirmada?r=${reg.id}` : "/");
  if (!holdsSeat(reg)) redirect(paymentPagePath(reg));
  if (method === "card" && !(await cardPaymentEnabled())) return { status: "error", message: "O pagamento com cartão não está disponível agora. Use o Pix." };
  if ((reg.paymentMethod ?? "pix") === method) redirect(paymentPagePath(reg));
  let next: string;
  try {
    const ticket = await currentOffer();
    next = await startOpaPayment(reg, method, `${ticket.name} — ${reg.name}`);
  } catch (err) {
    console.error("[switchPaymentMethod]", err);
    return { status: "error", message: method === "card" ? "Não conseguimos abrir o pagamento com cartão agora. Tente de novo ou siga no Pix." : "Não conseguimos gerar o Pix agora. Tente de novo em instantes." };
  }
  redirect(next);
}

async function stripeCheckout(registrationId: string, inviteCode: string, backPath: string, email: string, name: string, priceCents: number, productName: string) {
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
    cancel_url: `${appUrl()}${backPath}?cancelado=1`,
  });
  if (!session.url) throw new Error("Checkout sem URL");
  await attachStripeSession(registrationId, session.id);
  return session.url;
}
