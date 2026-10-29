import "server-only";
import { sendDuplicatePaymentAlert, sendLatePaymentAlert, sendLatePaymentReview, sendPaymentReceived } from "@/lib/mail";
import { createCharge, getCharge, getPayment } from "@/lib/opapingou";
import { getSetting } from "@/lib/settings";
import { methodFromKind, methodFromPayment, type ChargeKind, type ChargeStatus, type OpaCharge, type PaymentMethod } from "@/lib/opapingou-core";
import { holdsSeat, paidChargeOutcome } from "@/lib/payment-flow";
import { attachOpaCharge, countOpaCharges, getOpaChargeRow, getRegistration, lateSeatProblem, markChargeDuplicate, markPaid, markUnpaid, paidChargeId, type Registration } from "@/lib/registrations";

// Aplica o estado de uma cobrança do Opa Pingou à inscrição. Chamado pelo webhook, pelas páginas do Pix e do cartão
// e pelo botão "Conferir" do painel; markPaid é idempotente, então só uma delas manda o e-mail.
// A cobrança pode ser qualquer uma da inscrição (opa_charges): a atual ou uma anterior a retomar ou trocar de meio.
// - Inscrição não paga: confirma. Pagamento tardio (o link do cartão não expira no Abacate Pay): se ainda há vaga,
//   confirma como sempre; se o lote ou o convite lotou, ou a pessoa já tem outra inscrição paga, entra em aprovação.
// - Já paga por outra cobrança (Pix e depois o cartão): pagamento em dobro, marcado para estorno manual no painel.
export async function applyChargeStatus(
  reg: Registration,
  charge: Pick<OpaCharge, "id" | "status" | "amountCents"> & { paymentId?: string | null },
): Promise<Registration["status"]> {
  const row = await getOpaChargeRow(charge.id);
  if (row ? row.registrationId !== reg.id : charge.id !== reg.opaChargeId) throw new Error(`cobrança ${charge.id} não pertence à inscrição ${reg.id}`);
  const kind: ChargeKind = row?.kind ?? (reg.opaPaymentLink ? "PAYMENT_LINK" : "PIX_QR");
  const next = statusFromCharge(charge.status);
  if (next === "paid") {
    const outcome = paidChargeOutcome(reg, charge.id, reg.status === "paid" ? await paidChargeId(reg.id) : null);
    if (outcome === "noop") return "paid";
    if (outcome === "duplicate") return duplicatePayment(reg, charge.id);
    if (charge.amountCents !== reg.amountCents) {
      // Não deveria acontecer (valor fixo na criação); confirma mesmo assim e registra pra conferência
      console.warn(`[opapingou] cobrança ${charge.id} paga com ${charge.amountCents} ≠ ${reg.amountCents} da inscrição ${reg.id}`);
    }
    const late = !holdsSeat(reg);
    const review = late ? await lateSeatProblem(reg) : null;
    const method = await paidMethod(methodFromKind(kind), charge.paymentId ?? null);
    const paid = await markPaid(reg.id, null, charge.amountCents, { method, review, chargeId: charge.id });
    if (!paid) {
      // outra cobrança confirmou no mesmo instante: esta é a segunda
      const winner = await paidChargeId(reg.id);
      return winner && winner !== charge.id ? duplicatePayment(reg, charge.id) : "paid";
    }
    if (review) {
      console.warn(`[opapingou] pagamento tardio da inscrição ${reg.id} entrou em aprovação (${review})`);
      await sendLatePaymentReview(paid).catch((err) => console.error("[opapingou] e-mail do pagamento tardio", err));
      await sendLatePaymentAlert(paid, review).catch((err) => console.error("[opapingou] aviso do pagamento tardio", err));
    } else await sendPaymentReceived(paid);
    return "paid";
  }
  if (next === "expired" || next === "canceled") await markUnpaid(reg.id, next, charge.id);
  return next === "pending" ? reg.status : next;
}

async function duplicatePayment(reg: Registration, chargeId: string): Promise<"paid"> {
  if (await markChargeDuplicate(chargeId)) {
    console.warn(`[opapingou] pagamento em dobro: cobrança ${chargeId} paga com a inscrição ${reg.id} já paga`);
    const fresh = (await getRegistration(reg.id)) ?? reg;
    await sendDuplicatePaymentAlert(fresh, chargeId).catch((err) => console.error("[opapingou] aviso do pagamento em dobro", err));
  }
  return "paid";
}

// Meio de pagamento confirmado: o link do cartão também aceita Pix. A consulta do pagamento precisa do escopo
// payments:read; sem ele (ou sem paymentId), fica o meio da cobrança.
async function paidMethod(fallback: PaymentMethod, paymentId: string | null): Promise<PaymentMethod> {
  if (fallback !== "card" || !paymentId) return fallback;
  try {
    return methodFromPayment((await getPayment(paymentId)).method, fallback);
  } catch (err) {
    console.warn(`[opapingou] sem o meio do pagamento ${paymentId}; fica ${fallback}`, err instanceof Error ? err.message : err);
    return fallback;
  }
}

const statusFromCharge = (s: ChargeStatus) => (s === "PAID" ? "paid" : s === "EXPIRED" ? "expired" : s === "CANCELED" ? "canceled" : "pending");

// Consulta a cobrança na API e aplica. Falha de rede/API não derruba a página: devolve o status atual.
export async function syncCharge(reg: Registration): Promise<Registration["status"]> {
  if (reg.status === "paid" || !reg.opaChargeId) return reg.status;
  try {
    return await applyChargeStatus(reg, await getCharge(reg.opaChargeId));
  } catch (err) {
    console.error(`[opapingou] falha ao consultar a cobrança ${reg.opaChargeId}`, err);
    return reg.status;
  }
}

// Nova cobrança na inscrição (a primeira, ou outra ao retomar ou trocar Pix ↔ cartão) e a página de pagamento dela.
// A anterior não é cancelada (a API não cancela): se ainda for paga, applyChargeStatus resolve.
export async function startOpaPayment(reg: Pick<Registration, "id" | "amountCents">, method: PaymentMethod, description: string): Promise<string> {
  const card = method === "card";
  const charge = await createCharge(reg.id, reg.amountCents, description, {
    kind: card ? "PAYMENT_LINK" : "PIX_QR",
    bankAccountId: card ? await getSetting("opapingou_card_account") : null,
    attempt: await countOpaCharges(reg.id),
  });
  if (card ? !charge.paymentLink : !charge.brCode) throw new Error(`Cobrança ${charge.id} sem ${card ? "link de pagamento" : "copia e cola"}`);
  await attachOpaCharge(reg.id, { ...charge, kind: charge.kind ?? (card ? "PAYMENT_LINK" : "PIX_QR") });
  return `/inscricao/${card ? "cartao" : "pix"}/${reg.id}`;
}
