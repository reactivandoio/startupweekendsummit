// Situação de uma inscrição juntando pagamento e aprovação. Sem "server-only": usado pelo painel, pelo CSV e pelos testes.
//
// Origem "invite": convite criado no painel; paga = confirmada (approval fica null).
// Origem "open": cadastro aberto (/inscricao/aberta); paga entra "pending" na aprovação e só vira confirmada quando aprovada.

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

export const sourceLabel: Record<RegistrationSource, string> = { invite: "Convite", open: "Cadastro aberto" };

type Reg = { status: RegistrationStatus; approval: ApprovalStatus | null };

export function situation(r: Reg): Situation {
  if (r.approval === "rejected") return "rejected";
  if (r.status === "pending") return "awaiting_payment";
  if (r.status !== "paid") return "unpaid";
  return r.approval === "pending" ? "awaiting_approval" : "confirmed";
}

// Tem ingresso válido (e-mail com o número já enviado ou a enviar)
export const isConfirmed = (r: Reg) => situation(r) === "confirmed";

// Filtros da lista de participantes (?situacao=…&origem=…); valor desconhecido = todos
export const situationFilters = ["confirmed", "awaiting_approval", "rejected", "awaiting_payment", "unpaid"] as const satisfies readonly Situation[];
export const sourceFilters = ["invite", "open"] as const satisfies readonly RegistrationSource[];

export const parseSituation = (v: unknown): Situation | null => (situationFilters as readonly unknown[]).includes(v) ? (v as Situation) : null;
export const parseSource = (v: unknown): RegistrationSource | null => (sourceFilters as readonly unknown[]).includes(v) ? (v as RegistrationSource) : null;

export function matchesFilters(r: Reg & { source: RegistrationSource }, f: { situation: Situation | null; source: RegistrationSource | null }) {
  return (!f.situation || situation(r) === f.situation) && (!f.source || r.source === f.source);
}

// Meio de pagamento para o painel e o CSV. payment_method vem do kind da cobrança (ou do pagamento, quando a chave
// lê pagamentos); inscrições de antes do cartão no Opa Pingou foram todas Pix; Stripe é Checkout (cartão).
export function paymentMethodName(r: { provider: string; paymentMethod: "pix" | "card" | null }): string {
  if (r.provider === "courtesy") return "Cortesia";
  if (r.paymentMethod === "card") return "Cartão de crédito";
  if (r.paymentMethod === "pix" || r.provider === "opapingou") return "Pix";
  return "Cartão (Stripe)";
}

// Página de pagamento do Opa Pingou: QR do Pix ou "aguardando pagamento" do cartão (link de pagamento)
export const paymentPagePath = (r: { id: string; opaPaymentLink: string | null }) => (r.opaPaymentLink ? `/inscricao/cartao/${r.id}` : `/inscricao/pix/${r.id}`);

// Para onde voltar para pagar de novo (Pix expirado, checkout cancelado)
export const formPath = (r: { source: RegistrationSource; inviteCode: string }) => (r.source === "open" ? "/inscricao/aberta" : `/inscricao/${r.inviteCode}`);
