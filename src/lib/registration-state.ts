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

// Filtros da lista de participantes (?situacao=…&origem=…&cupom=…); valor desconhecido = todos.
// origem: convite, inscrição aberta ou link de cupom; cupom: código, ou "-" para as inscrições sem cupom.
export const situationFilters = ["confirmed", "awaiting_approval", "rejected", "awaiting_payment", "unpaid"] as const satisfies readonly Situation[];

export const parseSituation = (v: unknown): Situation | null => (situationFilters as readonly unknown[]).includes(v) ? (v as Situation) : null;
export const parseCouponFilter = (v: unknown): string | null => (typeof v === "string" && /^(-|[A-Za-z0-9_-]{1,40})$/.test(v) ? v.toUpperCase() : null);

export type Filters = { situation: Situation | null; entry: RegistrationEntry | null; coupon: string | null };

export function matchesFilters(r: Reg & { source: RegistrationSource; couponViaLink: boolean; couponCode: string | null }, f: Filters) {
  return (
    (!f.situation || situation(r) === f.situation) &&
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
