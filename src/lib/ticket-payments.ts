import "server-only";
import { sendRegistrationConfirmed } from "@/lib/mail";
import { getCharge } from "@/lib/opapingou";
import type { ChargeStatus, OpaCharge } from "@/lib/opapingou-core";
import { markPaid, markUnpaid, type Registration } from "@/lib/registrations";

// Aplica o estado de uma cobrança do Opa Pingou à inscrição. Chamado pelo webhook, pela página do Pix
// e pelo botão "Conferir" do painel; markPaid é idempotente, então só uma das três manda o e-mail.
export async function applyChargeStatus(reg: Registration, charge: Pick<OpaCharge, "id" | "status" | "amountCents">): Promise<Registration["status"]> {
  if (charge.id !== reg.opaChargeId) throw new Error(`cobrança ${charge.id} não pertence à inscrição ${reg.id}`);
  const next = statusFromCharge(charge.status);
  if (next === "paid") {
    if (charge.amountCents !== reg.amountCents) {
      // Não deveria acontecer (valor fixo na criação); confirma mesmo assim e registra pra conferência
      console.warn(`[opapingou] cobrança ${charge.id} paga com ${charge.amountCents} ≠ ${reg.amountCents} da inscrição ${reg.id}`);
    }
    const paid = await markPaid(reg.id, null, charge.amountCents);
    if (paid) await sendRegistrationConfirmed(paid);
    return "paid";
  }
  if (next === "expired" || next === "canceled") await markUnpaid(reg.id, next);
  return next === "pending" ? reg.status : next;
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
