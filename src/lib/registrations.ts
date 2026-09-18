import "server-only";
import { ensureSchema, sql } from "@/lib/db";

export type RegistrationStatus = "pending" | "paid" | "expired" | "canceled";

export type Registration = {
  id: string;
  inviteId: string;
  inviteName: string;
  inviteCode: string;
  name: string;
  email: string;
  phone: string; // só dígitos
  cpf: string; // só dígitos
  birthDate: string; // YYYY-MM-DD
  status: RegistrationStatus;
  amountCents: number;
  stripeSessionId: string | null;
  stripePaymentIntent: string | null;
  createdAt: string;
  paidAt: string | null;
};

type Row = {
  id: string;
  invite_id: string;
  invite_name?: string;
  invite_code?: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birth_date: string | Date;
  status: RegistrationStatus;
  amount_cents: number;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  created_at: Date;
  paid_at: Date | null;
};

const toRegistration = (r: Row): Registration => ({
  id: r.id,
  inviteId: r.invite_id,
  inviteName: r.invite_name ?? "",
  inviteCode: r.invite_code ?? "",
  name: r.name,
  email: r.email,
  phone: r.phone,
  cpf: r.cpf,
  birthDate: r.birth_date instanceof Date ? r.birth_date.toISOString().slice(0, 10) : String(r.birth_date),
  status: r.status,
  amountCents: r.amount_cents,
  stripeSessionId: r.stripe_session_id,
  stripePaymentIntent: r.stripe_payment_intent,
  createdAt: r.created_at.toISOString(),
  paidAt: r.paid_at ? r.paid_at.toISOString() : null,
});

const withInvite = () => sql`select r.*, i.name as invite_name, i.code as invite_code from registrations r join invites i on i.id = r.invite_id`;

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

// Mesma pessoa (e-mail ou CPF) já com ingresso pago?
export async function findPaidRegistration(email: string, cpf: string): Promise<Registration | null> {
  await ensureSchema();
  const [row] = await sql<Row[]>`
    ${withInvite()} where r.status = 'paid' and (r.email = ${email} or r.cpf = ${cpf}) limit 1`;
  return row ? toRegistration(row) : null;
}

export async function createRegistration(data: {
  inviteId: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  amountCents: number;
}): Promise<Registration> {
  await ensureSchema();
  const [row] = await sql<Row[]>`
    insert into registrations (invite_id, name, email, phone, cpf, birth_date, amount_cents)
    values (${data.inviteId}, ${data.name}, ${data.email}, ${data.phone}, ${data.cpf}, ${data.birthDate}, ${data.amountCents})
    returning *`;
  return toRegistration(row);
}

export async function attachStripeSession(id: string, sessionId: string) {
  await ensureSchema();
  await sql`update registrations set stripe_session_id = ${sessionId} where id = ${id}`;
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

// Remove só o que nunca foi pago (pago se resolve no Stripe, com estorno)
export async function deleteUnpaidRegistration(id: string) {
  await ensureSchema();
  await sql`delete from registrations where id = ${id} and status <> 'paid'`;
}
