import "server-only";
import { ensureSchema, sql } from "@/lib/db";
import { methodFromKind, type ChargeKind, type PaymentMethod } from "@/lib/opapingou-core";
import type { ApprovalStatus, RegistrationSource, RegistrationStatus, ReviewReason } from "@/lib/registration-state";
import type { PaymentProvider } from "@/lib/tickets";

export type { ApprovalStatus, RegistrationSource, RegistrationStatus, ReviewReason } from "@/lib/registration-state";

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
  opaPaymentLink: string | null; // checkout do cartão (link de pagamento)
  paymentMethod: PaymentMethod | null; // null: Stripe, cortesia e inscrições de antes do cartão (Pix)
  reviewReason: ReviewReason | null; // pagamento tardio que entrou em aprovação
  duplicateCharges: DuplicateCharge[]; // cobranças pagas depois de a inscrição já estar paga: estorno manual
  sponsorConsentAt: string | null; // quando aceitou compartilhar os dados com patrocinadores; null = não aceitou
  createdAt: string;
  paidAt: string | null;
};

// Cobrança paga em dobro (ex.: Pix pago e depois o link do cartão): fica para estorno manual no painel do Opa Pingou
export type DuplicateCharge = { id: string; kind: string; at: string; refundedAt: string | null };

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
  opa_payment_link: string | null;
  payment_method: PaymentMethod | null;
  review_reason: ReviewReason | null;
  duplicate_charges?: DuplicateCharge[] | null;
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
  opaPaymentLink: r.opa_payment_link,
  paymentMethod: r.payment_method,
  reviewReason: r.review_reason,
  duplicateCharges: r.duplicate_charges ?? [],
  sponsorConsentAt: r.sponsor_consent_at ? r.sponsor_consent_at.toISOString() : null,
  createdAt: r.created_at.toISOString(),
  paidAt: r.paid_at ? r.paid_at.toISOString() : null,
});

const withInvite = () => sql`
  select r.*, i.name as invite_name, i.code as invite_code, l.name as lot_name,
    (select coalesce(json_agg(json_build_object('id', c.id, 'kind', c.kind, 'at', c.duplicate_at, 'refundedAt', c.refunded_at) order by c.duplicate_at), '[]'::json)
      from opa_charges c where c.registration_id = r.id and c.duplicate_at is not null) as duplicate_charges
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

// Por qualquer cobrança da inscrição (a atual ou uma anterior, de antes de retomar ou trocar de meio)
export async function getRegistrationByCharge(chargeId: string): Promise<Registration | null> {
  await ensureSchema();
  const [row] = await sql<Row[]>`
    ${withInvite()} where r.opa_charge_id = ${chargeId} or r.id = (select registration_id from opa_charges where id = ${chargeId})`;
  return row ? toRegistration(row) : null;
}

export type OpaChargeRow = { id: string; registrationId: string; kind: ChargeKind };

export async function getOpaChargeRow(chargeId: string): Promise<OpaChargeRow | null> {
  await ensureSchema();
  const [row] = await sql<{ id: string; registration_id: string; kind: ChargeKind }[]>`select id, registration_id, kind from opa_charges where id = ${chargeId}`;
  return row ? { id: row.id, registrationId: row.registration_id, kind: row.kind } : null;
}

// Cobrança que confirmou a inscrição; nas antigas (e no instante entre markPaid e o paid_at), a atual da inscrição,
// que markPaid troca para a que pagou na mesma escrita
export async function paidChargeId(registrationId: string): Promise<string | null> {
  await ensureSchema();
  const [row] = await sql<{ id: string | null }[]>`
    select coalesce(
      (select id from opa_charges where registration_id = r.id and paid_at is not null and duplicate_at is null order by paid_at limit 1),
      r.opa_charge_id) as id
    from registrations r where r.id = ${registrationId}`;
  return row?.id ?? null;
}

// Idempotente: true só na primeira vez (quem recebe true avisa a organização)
export async function markChargeDuplicate(chargeId: string): Promise<boolean> {
  await ensureSchema();
  const rows = await sql`update opa_charges set duplicate_at = now(), paid_at = coalesce(paid_at, now()) where id = ${chargeId} and duplicate_at is null returning id`;
  return rows.length > 0;
}

export async function setDuplicateChargeRefunded(chargeId: string, refunded: boolean) {
  await ensureSchema();
  await sql`update opa_charges set refunded_at = ${refunded ? new Date() : null} where id = ${chargeId} and duplicate_at is not null`;
}

// Quem volta ao formulário (abandonou o Pix ou o cartão no meio): a inscrição não paga mais recente da mesma pessoa
// (CPF ou e-mail) no mesmo fluxo — mesmo convite, ou cadastro aberto. Retomada em vez de uma segunda inscrição,
// que esbarraria na vaga que a primeira ainda segura.
export async function findResumableRegistration(f: { source: RegistrationSource; inviteId: string | null; email: string; cpf: string }): Promise<Registration | null> {
  await ensureSchema();
  const [row] = await sql<Row[]>`
    ${withInvite()}
    where r.status <> 'paid' and r.provider = 'opapingou' and r.source = ${f.source}
      and r.invite_id is not distinct from ${f.inviteId}::uuid and r.approval is distinct from 'rejected'
      and (r.cpf = ${f.cpf} or r.email = ${f.email})
    order by r.created_at desc limit 1`;
  return row ? toRegistration(row) : null;
}

// Retomada: os dados do formulário valem (podem ter mudado); preço e lote só mudam quando a vaga não estava mais segura
export async function updateRegistrationData(
  id: string,
  data: { name: string; email: string; phone: string; cpf: string; birthDate: string; sponsorConsent: boolean; price?: { amountCents: number; listPriceCents: number; discountCents: number; lotId: string | null } },
) {
  await ensureSchema();
  const p = data.price;
  await sql`
    update registrations
    set name = ${data.name}, email = ${data.email}, phone = ${data.phone}, cpf = ${data.cpf}, birth_date = ${data.birthDate},
        sponsor_consent_at = case when ${data.sponsorConsent} then coalesce(sponsor_consent_at, now()) else null end,
        amount_cents = coalesce(${p?.amountCents ?? null}::int, amount_cents),
        list_price_cents = coalesce(${p?.listPriceCents ?? null}::int, list_price_cents),
        discount_cents = coalesce(${p?.discountCents ?? null}::int, discount_cents),
        lot_id = case when ${p ? true : false} then ${p?.lotId ?? null}::uuid else lot_id end
    where id = ${id} and status <> 'paid'`;
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

// Cobrança atual da inscrição (a primeira, ou uma nova ao retomar ou trocar de meio). A anterior continua em
// opa_charges: se for paga, ainda confirma a inscrição (ou vira pagamento em dobro, se outra já confirmou).
// Volta para "pending": o Pix expirado ou cancelado que a pessoa retomou está aberto de novo.
export async function attachOpaCharge(id: string, charge: { id: string; kind: ChargeKind; brCode: string | null; paymentLink: string | null; expiresAt: string }) {
  await ensureSchema();
  await sql.begin(async (tx) => {
    await tx`insert into opa_charges (id, registration_id, kind) values (${charge.id}, ${id}, ${charge.kind}) on conflict (id) do nothing`;
    await tx`
      update registrations
      set opa_charge_id = ${charge.id}, opa_br_code = ${charge.brCode}, opa_payment_link = ${charge.paymentLink},
          opa_expires_at = ${charge.expiresAt}, payment_method = ${methodFromKind(charge.kind)}, status = 'pending'
      where id = ${id} and status <> 'paid'`;
  });
}

// Quantas cobranças a inscrição já teve (a Idempotency-Key da próxima precisa ser outra)
export async function countOpaCharges(id: string): Promise<number> {
  await ensureSchema();
  const [row] = await sql<{ n: number | string }[]>`select count(*) as n from opa_charges where registration_id = ${id}`;
  return Number(row?.n ?? 0);
}

// Idempotente: só a primeira chamada retorna a inscrição (quem retorna, envia o e-mail de confirmação).
// review: pagamento tardio sem vaga (ou de quem já tem outra paga) entra em aprovação no painel.
export async function markPaid(
  id: string,
  paymentIntent: string | null,
  amountCents: number | null,
  opts: { method?: PaymentMethod | null; review?: ReviewReason | null; chargeId?: string | null } = {},
): Promise<Registration | null> {
  await ensureSchema();
  const review = opts.review ?? null;
  const chargeId = opts.chargeId ?? null;
  const [row] = await sql<{ id: string }[]>`
    update registrations
    set status = 'paid', paid_at = now(), opa_charge_id = coalesce(${chargeId}, opa_charge_id),
        stripe_payment_intent = coalesce(${paymentIntent}, stripe_payment_intent),
        amount_cents = coalesce(${amountCents}, amount_cents),
        payment_method = coalesce(${opts.method ?? null}, payment_method),
        review_reason = ${review},
        approval = case when ${review}::text is null then approval else 'pending' end
    where id = ${id} and status <> 'paid'
    returning id`;
  if (!row) return null;
  if (chargeId) await sql`update opa_charges set paid_at = now() where id = ${chargeId} and paid_at is null`;
  return getRegistration(row.id);
}

// Pagamento tardio: a vaga que a inscrição segurava (1h) já pode ter sido vendida. Conta as outras inscrições do
// mesmo lote e do mesmo convite com a regra de vaga de sempre (pagas + pendentes de menos de 1h, sem as reprovadas).
export async function lateSeatProblem(reg: Pick<Registration, "id" | "lotId" | "inviteId" | "email" | "cpf">): Promise<ReviewReason | null> {
  await ensureSchema();
  const [dup] = await sql`
    select 1 from registrations
    where id <> ${reg.id} and status = 'paid' and approval is distinct from 'rejected' and (email = ${reg.email} or cpf = ${reg.cpf}) limit 1`;
  if (dup) return "duplicate";
  const holds = () => sql`id <> ${reg.id} and (status = 'paid' or (status = 'pending' and coalesce(opa_expires_at, created_at + interval '1 hour') > now()))`;
  if (reg.lotId) {
    const [lot] = await sql<{ full: boolean }[]>`
      select l.quantity is not null and (select count(*) from registrations
        where lot_id = l.id and approval is distinct from 'rejected' and ${holds()}) >= l.quantity as full
      from ticket_lots l where l.id = ${reg.lotId}`;
    if (lot?.full) return "sold_out";
  }
  if (reg.inviteId) {
    const [inv] = await sql<{ full: boolean }[]>`
      select (select count(*) from registrations where invite_id = i.id and ${holds()}) >= i.max_uses as full
      from invites i where i.id = ${reg.inviteId}`;
    if (inv?.full) return "sold_out";
  }
  return null;
}

// Só mexe em pendentes e só pela cobrança atual: um pagamento confirmado nunca volta pra expirado/cancelado, e o
// fim de uma cobrança antiga não derruba a nova que a pessoa abriu ao retomar ou trocar de meio
export async function markUnpaid(id: string, status: "expired" | "canceled", chargeId: string | null = null) {
  await ensureSchema();
  await sql`
    update registrations set status = ${status}
    where id = ${id} and status = 'pending' and (${chargeId}::text is null or opa_charge_id = ${chargeId})`;
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
