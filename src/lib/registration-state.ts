// Situação de uma inscrição juntando pagamento e aprovação. Sem "server-only": usado pelo painel, pelo CSV e pelos testes.
//
// Toda inscrição nova, por convite ("invite") ou aberta ("open", /inscricao/aberta), paga ou gratuita, nasce com
// approval "pending": paga (ou gratuita), fica aguardando aprovação e só vira confirmada quando aprovada no painel.
// approval null: inscrição por convite de antes dessa regra, confirmada ao pagar.
import { registrationEntry, type RegistrationEntry } from "./coupons-core.ts";

export type RegistrationSource = "invite" | "open";
export type RegistrationStatus = "pending" | "paid" | "expired" | "canceled";
export type ApprovalStatus = "pending" | "approved" | "rejected";

// Pagamento que chegou depois do prazo (o link do cartão não expira no Abacate Pay) e não cabe mais:
// entra em aprovação, inclusive pelo convite. sold_out: o lote ou o convite lotou; duplicate: a pessoa já tem outra paga.
export type ReviewReason = "sold_out" | "duplicate";
export const reviewReasonLabel: Record<ReviewReason, string> = {
  sold_out: "Pago depois do prazo, com o lote ou o convite já lotado",
  duplicate: "Pago depois do prazo, mas a pessoa já tem outra inscrição paga",
};

export type Situation = "confirmed" | "awaiting_approval" | "rejected" | "awaiting_payment" | "unpaid";

export const situationLabel: Record<Situation, string> = {
  confirmed: "Confirmada",
  awaiting_approval: "Aguardando aprovação",
  rejected: "Reprovada",
  awaiting_payment: "Aguardando pagamento",
  unpaid: "Não paga",
};


type Reg = { status: RegistrationStatus; approval: ApprovalStatus | null };

export function situation(r: Reg): Situation {
  if (r.approval === "rejected") return "rejected";
  if (r.status === "pending") return "awaiting_payment";
  if (r.status !== "paid") return "unpaid";
  return r.approval === "pending" ? "awaiting_approval" : "confirmed";
}

// Tem ingresso válido (e-mail com o número já enviado ou a enviar)
export const isConfirmed = (r: Reg) => situation(r) === "confirmed";

// Remoção é sempre lógica (removed_at/removed_by): a inscrição fica no banco com dados, cobrança e histórico, mas some
// da lista e do CSV padrão, não segura vaga do lote/convite nem uso de cupom e não entra nas contagens do painel.
// Só sai da lista quem não tem ingresso: reprovada, ou que nunca pagou. Restaurar volta ao que era (reprovada fica reprovada).
type Removable = Reg & { removedAt?: string | null };

export const canRemove = (r: Removable) => !r.removedAt && (r.approval === "rejected" || r.status !== "paid");

// Texto da confirmação de remover; reprovada paga e ainda não reembolsada ganha o aviso do estorno manual
export function removeConfirmMessage(r: Removable & { name: string; amountCents: number; refundedAt: string | null }, brl: (cents: number) => string) {
  const base = `Remover a inscrição de ${r.name} da lista? Ela fica guardada em "Removidas", com todos os dados, e pode ser restaurada.`;
  if (r.approval === "rejected" && r.status === "paid" && r.amountCents > 0 && !r.refundedAt) {
    return `ATENÇÃO: ${r.name} pagou ${brl(r.amountCents)} e o reembolso ainda não foi marcado como feito. Remover não estorna nada: o estorno é manual no painel do Opa Pingou (ou do Stripe).\n\n${base}`;
  }
  return base;
}

// Filtros da lista de participantes (?situacao=…&origem=…&cupom=…); valor desconhecido = todos.
// origem: convite, inscrição aberta ou link de cupom; cupom: código, ou "-" para as inscrições sem cupom.
// situacao=removed: só as removidas (todas as outras opções mostram só as não removidas).
export const situationFilters = ["confirmed", "awaiting_approval", "rejected", "awaiting_payment", "unpaid"] as const satisfies readonly Situation[];

export type SituationFilter = Situation | "removed";

export const parseSituation = (v: unknown): SituationFilter | null =>
  v === "removed" || (situationFilters as readonly unknown[]).includes(v) ? (v as SituationFilter) : null;
export const parseCouponFilter = (v: unknown): string | null => (typeof v === "string" && /^(-|[A-Za-z0-9_-]{1,40})$/.test(v) ? v.toUpperCase() : null);

export type Filters = { situation: SituationFilter | null; entry: RegistrationEntry | null; coupon: string | null };

export function matchesFilters(r: Removable & { source: RegistrationSource; couponViaLink: boolean; couponCode: string | null }, f: Filters) {
  if (f.situation === "removed" ? !r.removedAt : r.removedAt) return false;
  return (
    (!f.situation || f.situation === "removed" || situation(r) === f.situation) &&
    (!f.entry || registrationEntry(r) === f.entry) &&
    (!f.coupon || (f.coupon === "-" ? !r.couponCode : r.couponCode === f.coupon))
  );
}

// Meio de pagamento para o painel e o CSV. payment_method vem do kind da cobrança (ou do pagamento, quando a chave
// lê pagamentos); inscrições de antes do cartão no Opa Pingou foram todas Pix; Stripe é Checkout (cartão).
// Sem cobrança: cortesia do convite ou gratuita pelo cupom de 100%.
export function paymentMethodName(r: { provider: string; paymentMethod: "pix" | "card" | null; discountSource?: string | null }): string {
  if (r.provider === "courtesy") return r.discountSource === "coupon" ? "Gratuita (cupom)" : "Cortesia";
  if (r.paymentMethod === "card") return "Cartão de crédito";
  if (r.paymentMethod === "pix" || r.provider === "opapingou") return "Pix";
  return "Cartão (Stripe)";
}

// Página de pagamento do Opa Pingou: QR do Pix ou "aguardando pagamento" do cartão (link de pagamento)
export const paymentPagePath = (r: { id: string; opaPaymentLink: string | null }) => (r.opaPaymentLink ? `/inscricao/cartao/${r.id}` : `/inscricao/pix/${r.id}`);

// Para onde voltar para pagar de novo (Pix expirado, checkout cancelado)
export const formPath = (r: { source: RegistrationSource; inviteCode: string }) => (r.source === "open" ? "/inscricao/aberta" : `/inscricao/${r.inviteCode}`);
