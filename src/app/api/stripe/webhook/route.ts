import type Stripe from "stripe";
import { formatBRL } from "@/lib/cpf";
import { sendRegistrationConfirmed } from "@/lib/mail";
import { getRegistrationBySession, markPaid, markUnpaid } from "@/lib/registrations";
import { stripe } from "@/lib/stripe";

// Webhook do Stripe (Developers → Webhooks → endpoint /api/stripe/webhook).
// Eventos: checkout.session.completed, .async_payment_succeeded, .async_payment_failed, .expired
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return new Response("Webhook não configurado", { status: 400 });

  let event: Stripe.Event;
  try {
    // corpo cru: a assinatura é calculada sobre os bytes originais
    event = stripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch (err) {
    console.error("[stripe] assinatura inválida", err);
    return new Response("Assinatura inválida", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        // cartão confirma na hora; Pix/boleto chegam como "unpaid" no completed e pagam depois
        if (session.payment_status === "paid") await confirm(session);
        break;
      }
      case "checkout.session.async_payment_failed":
        await settle(event.data.object, "canceled");
        break;
      case "checkout.session.expired":
        await settle(event.data.object, "expired");
        break;
    }
  } catch (err) {
    // 500 faz o Stripe reenviar o evento
    console.error(`[stripe] falha ao processar ${event.type}`, err);
    return new Response("Erro ao processar", { status: 500 });
  }
  return Response.json({ received: true });
}

async function findRegistration(session: Stripe.Checkout.Session) {
  const reg = await getRegistrationBySession(session.id);
  if (reg) return reg;
  console.warn(`[stripe] sessão ${session.id} sem inscrição (registration_id=${session.metadata?.registration_id ?? "?"})`);
  return null;
}

async function confirm(session: Stripe.Checkout.Session) {
  const reg = await findRegistration(session);
  if (!reg) return;
  const pi = typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);
  const paid = await markPaid(reg.id, pi, session.amount_total);
  if (paid) await sendRegistrationConfirmed(paid.email, paid.name, formatBRL(paid.amountCents));
}

async function settle(session: Stripe.Checkout.Session, status: "expired" | "canceled") {
  const reg = await findRegistration(session);
  if (reg) await markUnpaid(reg.id, status);
}
