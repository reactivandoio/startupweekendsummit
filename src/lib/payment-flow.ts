// Decisões do pagamento no Opa Pingou (sem "server-only" nem banco), cobertas por testes.
//
// Identificação: o front só conhece o id da inscrição (uuid nosso, na URL /inscricao/pix/[id] e /inscricao/cartao/[id]).
// O polling recarrega essa página, que lê a inscrição no nosso banco. O webhook liga o evento à inscrição pelo
// data.object.id do charge.* (id da cobrança no Opa Pingou), procurado em opa_charges. Nenhum id do provedor
// (E2E do Pix, txid, providerRef) é usado.

export const HOLD_MS = 60 * 60 * 1000; // a cobrança vale 1h e segura a vaga nesse tempo

type Holder = { status: string; createdAt: string; opaExpiresAt: string | null };

// Ainda segura a vaga do lote/convite: pendente e dentro do prazo da cobrança atual (Stripe: 1h da criação)
export function holdsSeat(r: Holder, now = Date.now()): boolean {
  if (r.status !== "pending") return false;
  const until = r.opaExpiresAt ? new Date(r.opaExpiresAt).getTime() : new Date(r.createdAt).getTime() + HOLD_MS;
  return until > now;
}

// Quem volta ao formulário com uma inscrição não paga do mesmo fluxo (mesmo convite ou cadastro aberto):
// - "reuse": a cobrança atual ainda vale e é do meio escolhido → volta para a página dela, sem cobrança nova;
// - "new_charge": expirou, foi cancelada ou a pessoa trocou de meio → nova cobrança na mesma inscrição.
export type ResumePlan = "reuse" | "new_charge";
export function resumePlan(r: Holder & { paymentMethod: "pix" | "card" | null }, chosen: "pix" | "card", now = Date.now()): ResumePlan {
  return holdsSeat(r, now) && (r.paymentMethod ?? "pix") === chosen ? "reuse" : "new_charge";
}

// charge.paid de uma das cobranças da inscrição:
// - "apply": a inscrição ainda não foi paga → esta cobrança confirma (mesmo que não seja a mais recente);
// - "noop": é a mesma cobrança que já confirmou (webhook repetido, "Já paguei", "Conferir");
// - "duplicate": a inscrição já foi paga por outra cobrança (ex.: Pix pago e depois o link do cartão) →
//   marca para estorno manual e avisa a organização. Nunca confirma duas vezes.
export type PaidOutcome = "apply" | "noop" | "duplicate";
// paidChargeId: a cobrança que confirmou a inscrição (opa_charges.paid_at; nas antigas, a cobrança atual).
export function paidChargeOutcome(reg: { status: string }, chargeId: string, paidChargeId: string | null): PaidOutcome {
  if (reg.status !== "paid") return "apply";
  return chargeId === paidChargeId ? "noop" : "duplicate";
}
