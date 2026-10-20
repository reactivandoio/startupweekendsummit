import { ensureSchema, sql } from "@/lib/db";
import { chargeEventStatus, parseOpaEvent, verifyOpaSignature, type ChargeStatus, type OpaCharge } from "@/lib/opapingou-core";
import { getRegistrationByCharge } from "@/lib/registrations";
import { getSetting } from "@/lib/settings";
import { applyChargeStatus } from "@/lib/ticket-payments";

const eventChargeStatus: Record<"paid" | "expired" | "canceled", ChargeStatus> = { paid: "PAID", expired: "EXPIRED", canceled: "CANCELED" };

// Webhook do Opa Pingou (cadastrado pelo painel em /admin/ingressos).
// Eventos: charge.paid, charge.expired, charge.canceled; ping chega no "Enviar teste".
export async function POST(request: Request) {
  const secret = await getSetting("opapingou_webhook_secret");
  if (!secret) return new Response("Webhook não configurado", { status: 400 });

  // corpo cru: a assinatura é calculada sobre os bytes originais
  const raw = await request.text();
  if (!verifyOpaSignature(raw, request.headers.get("opa-signature"), secret)) {
    console.error("[opapingou] assinatura inválida");
    return new Response("Assinatura inválida", { status: 400 });
  }
  const event = parseOpaEvent(raw);
  if (!event) return new Response("Corpo inválido", { status: 400 });

  await ensureSchema();
  const [seen] = await sql`select 1 from opa_events where id = ${event.id}`;
  if (seen) return Response.json({ received: true, duplicate: true });

  try {
    const status = chargeEventStatus[event.type];
    if (status && event.data.type === "charge") {
      const charge = event.data.object as Partial<OpaCharge>;
      const reg = await getRegistrationByCharge(String(charge.id));
      // o tipo do evento é o que vale; o objeto vem igual ao da API, mas não dependemos de todos os campos
      if (reg) {
        await applyChargeStatus(reg, {
          id: reg.opaChargeId ?? "",
          status: eventChargeStatus[status],
          amountCents: typeof charge.amountCents === "number" ? charge.amountCents : reg.amountCents,
        });
      } else console.warn(`[opapingou] ${event.type} da cobrança ${charge.id} sem inscrição`);
    }
    await sql`insert into opa_events (id, type) values (${event.id}, ${event.type}) on conflict (id) do nothing`;
  } catch (err) {
    // fora de 2xx o Opa Pingou reenvia o evento (até 8 tentativas em ~45h)
    console.error(`[opapingou] falha ao processar ${event.type} ${event.id}`, err);
    return new Response("Erro ao processar", { status: 500 });
  }
  return Response.json({ received: true });
}
