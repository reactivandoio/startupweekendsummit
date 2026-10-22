import "server-only";
import { ensureSchema, sql } from "@/lib/db";
import type { ApprovalStatus, RegistrationSource, RegistrationStatus } from "@/lib/registration-state";
import type { PaymentProvider } from "@/lib/tickets";

export type { ApprovalStatus, RegistrationSource, RegistrationStatus } from "@/lib/registration-state";

// "courtesy": convite com 100% de desconto, confirmado sem cobrança
export type RegistrationProvider = PaymentProvider | "courtesy";

export type Registration = {
  id: string;
  inviteId: string | null; // null no cadastro aberto
  inviteName: string;
  inviteCode: string;
  source: RegistrationSource;
  approval: ApprovalStatus | null; // null = convite (não passa por aprovação)
  reviewedAt: string | null;
  refundedAt: string | null; // reprovada paga: quando o reembolso foi feito no meio de pagamento
  name: string;
  email: string;
  phone: string; // só dígitos
  cpf: string; // só dígitos
  birthDate: string; // YYYY-MM-DD
  status: RegistrationStatus;
  amountCents: number; // valor pago (ou a pagar)
  listPriceCents: number; // preço do lote no momento da inscrição
  discountCents: number; // desconto do convite
  stripeSessionId: string | null;
  stripePaymentIntent: string | null;
  provider: RegistrationProvider;
  lotId: string | null;
  lotName: string;
  opaChargeId: string | null;
  opaBrCode: string | null;
  opaExpiresAt: string | null;
  sponsorConsentAt: string | null; // quando aceitou compartilhar os dados com patrocinadores; null = não aceitou
  createdAt: string;
  paidAt: string | null;
};

type Row = {
  id: string;
  invite_id: string | null;
  invite_name?: string | null;
  invite_code?: string | null;
  source: RegistrationSource;
  approval: ApprovalStatus | null;
  reviewed_at: Date | null;
  refunded_at: Date | null;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birth_date: string | Date;
  status: RegistrationStatus;
  amount_cents: number;
  list_price_cents: number | null;
  discount_cents: number;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  provider: RegistrationProvider;
  lot_id: string | null;
  lot_name?: string | null;
  opa_charge_id: string | null;
  opa_br_code: string | null;
  opa_expires_at: Date | null;
  sponsor_consent_at: Date | null;
  created_at: Date;
  paid_at: Date | null;
};

const toRegistration = (r: Row): Registration => ({
  id: r.id,
  inviteId: r.invite_id,
  inviteName: r.invite_name ?? "",
  inviteCode: r.invite_code ?? "",
  source: r.source,
  approval: r.approval,
  reviewedAt: r.reviewed_at ? r.reviewed_at.toISOString() : null,
  refundedAt: r.refunded_at ? r.refunded_at.toISOString() : null,
  name: r.name,
  email: r.email,
  phone: r.phone,
  cpf: r.cpf,
  birthDate: r.birth_date instanceof Date ? r.birth_date.toISOString().slice(0, 10) : String(r.birth_date),
  status: r.status,
  amountCents: r.amount_cents,
  listPriceCents: r.list_price_cents ?? r.amount_cents, // inscrições de antes do desconto: sem desconto
  discountCents: r.discount_cents,
  stripeSessionId: r.stripe_session_id,
  stripePaymentIntent: r.stripe_payment_intent,
  provider: r.provider,
  lotId: r.lot_id,
  lotName: r.lot_name ?? "",
  opaChargeId: r.opa_charge_id,
  opaBrCode: r.opa_br_code,
  opaExpiresAt: r.opa_expires_at ? r.opa_expires_at.toISOString() : null,
  sponsorConsentAt: r.sponsor_consent_at ? r.sponsor_consent_at.toISOString() : null,
  createdAt: r.created_at.toISOString(),
  paidAt: r.paid_at ? r.paid_at.toISOString() : null,
});

const withInvite = () => sql`
  select r.*, i.name as invite_name, i.code as invite_code, l.name as lot_name
  from registrations r left join invites i on i.id = r.invite_id left join ticket_lots l on l.id = r.lot_id`;

export async function listRegistrations(): Promise<Registration[]> {
  await ensureSchema();
  const rows = await sql<Row[]>`${withInvite()} order by r.created_at desc`;
  return rows.map(toRegistration);
}

export async function getRegistration(id: string): Promise<Registration | null> {
  await ensureSchema();
  const [row] = await sql<Row[]>`${withInvite()} where r.id = ${id}`;
  return row ? toRegistration(row) : null;
}

export async function getRegistrationBySession(sessionId: string): Promise<Registration | null> {
  await ensureSchema();
  const [row] = await sql<Row[]>`${withInvite()} where r.stripe_session_id = ${sessionId}`;
  return row ? toRegistration(row) : null;
}

export async function getRegistrationByCharge(chargeId: string): Promise<Registration | null> {
  await ensureSchema();
  const [row] = await sql<Row[]>`${withInvite()} where r.opa_charge_id = ${chargeId}`;
  return row ? toRegistration(row) : null;
}

// Pendentes do Opa Pingou com cobrança (o painel confere uma a uma na API)
export async function listPendingOpaRegistrations(): Promise<Registration[]> {
  await ensureSchema();
  const rows = await sql<Row[]>`${withInvite()} where r.status = 'pending' and r.opa_charge_id is not null order by r.created_at`;
  return rows.map(toRegistration);
}

// Mesma pessoa (e-mail ou CPF) já com inscrição paga? Reprovada não conta: pode entrar de novo por um convite.
export async function findPaidRegistration(email: string, cpf: string): Promise<Registration | null> {
  await ensureSchema();
  const [row] = await sql<Row[]>`
    ${withInvite()} where r.status = 'paid' and r.approval is distinct from 'rejected' and (r.email = ${email} or r.cpf = ${cpf}) limit 1`;
  return row ? toRegistration(row) : null;
}

export async function createRegistration(data: {
  inviteId: string | null;
  source: RegistrationSource;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  amountCents: number;
  listPriceCents: number;
  discountCents: number;
  provider: RegistrationProvider;
  lotId: string | null;
  sponsorConsent: boolean;
}): Promise<Registration> {
  await ensureSchema();
  const [row] = await sql<Row[]>`
    insert into registrations (invite_id, source, approval, name, email, phone, cpf, birth_date, amount_cents, list_price_cents, discount_cents, provider, lot_id, sponsor_consent_at)
    values (${data.inviteId}, ${data.source}, ${data.source === "open" ? "pending" : null}, ${data.name}, ${data.email}, ${data.phone}, ${data.cpf}, ${data.birthDate}, ${data.amountCents}, ${data.listPriceCents}, ${data.discountCents}, ${data.provider}, ${data.lotId}, ${data.sponsorConsent ? new Date() : null})
    returning *`;
  return toRegistration(row);
}

export async function attachStripeSession(id: string, sessionId: string) {
  await ensureSchema();
  await sql`update registrations set stripe_session_id = ${sessionId} where id = ${id}`;
}

export async function attachOpaCharge(id: string, charge: { id: string; brCode: string | null; expiresAt: string }) {
  await ensureSchema();
  await sql`
    update registrations set opa_charge_id = ${charge.id}, opa_br_code = ${charge.brCode}, opa_expires_at = ${charge.expiresAt}
    where id = ${id}`;
}

// Idempotente: só a primeira chamada retorna a inscrição (quem retorna, envia o e-mail de confirmação)
export async function markPaid(id: string, paymentIntent: string | null, amountCents: number | null): Promise<Registration | null> {
  await ensureSchema();
  const [row] = await sql<Row[]>`
    update registrations
    set status = 'paid', paid_at = now(),
        stripe_payment_intent = coalesce(${paymentIntent}, stripe_payment_intent),
        amount_cents = coalesce(${amountCents}, amount_cents)
    where id = ${id} and status <> 'paid'
    returning *`;
  return row ? toRegistration(row) : null;
}

// Só mexe em pendentes: um pagamento confirmado nunca volta pra expirado/cancelado
export async function markUnpaid(id: string, status: "expired" | "canceled") {
  await ensureSchema();
  await sql`update registrations set status = ${status} where id = ${id} and status = 'pending'`;
}

// Aprovar/reprovar: só cadastro aberto já pago e ainda em análise. Idempotente: só quem muda recebe a inscrição (e envia o e-mail).
export async function reviewRegistration(id: string, decision: "approved" | "rejected", userId: string): Promise<Registration | null> {
  await ensureSchema();
  const [row] = await sql<{ id: string }[]>`
    update registrations set approval = ${decision}, reviewed_at = now(), reviewed_by = ${userId}
    where id = ${id} and status = 'paid' and approval = 'pending'
    returning id`;
  return row ? getRegistration(row.id) : null;
}

// Reembolso de reprovada paga é manual no painel do Opa Pingou; aqui só fica a marcação
export async function setRefunded(id: string, refunded: boolean) {
  await ensureSchema();
  await sql`
    update registrations set refunded_at = ${refunded ? new Date() : null}
    where id = ${id} and status = 'paid' and approval = 'rejected'`;
}

// Remove só o que nunca foi pago (pago se resolve no Stripe, com estorno)
export async function deleteUnpaidRegistration(id: string) {
  await ensureSchema();
  await sql`delete from registrations where id = ${id} and status <> 'paid'`;
}
