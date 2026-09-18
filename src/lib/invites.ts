import "server-only";
import { randomBytes } from "node:crypto";
import { ensureSchema, sql } from "@/lib/db";

export type Invite = {
  id: string;
  code: string;
  name: string;
  email: string;
  note: string;
  maxUses: number;
  uses: number; // pagas + pendentes recentes (checkout ainda aberto)
  createdAt: string;
  revokedAt: string | null;
};

type Row = {
  id: string;
  code: string;
  name: string;
  email: string;
  note: string;
  max_uses: number;
  uses: number | string;
  created_at: Date;
  revoked_at: Date | null;
};

const toInvite = (r: Row): Invite => ({
  id: r.id,
  code: r.code,
  name: r.name,
  email: r.email,
  note: r.note,
  maxUses: r.max_uses,
  uses: Number(r.uses),
  createdAt: r.created_at.toISOString(),
  revokedAt: r.revoked_at ? r.revoked_at.toISOString() : null,
});

// Um checkout pendente segura a vaga por 1h (mesmo prazo do expires_at da sessão no Stripe)
const usesSubquery = () => sql`
  (select count(*) from registrations r
    where r.invite_id = i.id
      and (r.status = 'paid' or (r.status = 'pending' and r.created_at > now() - interval '1 hour')))`;

export async function listInvites(): Promise<Invite[]> {
  await ensureSchema();
  const rows = await sql<Row[]>`
    select i.*, ${usesSubquery()} as uses from invites i order by i.created_at desc`;
  return rows.map(toInvite);
}

export async function getInviteByCode(code: string): Promise<Invite | null> {
  await ensureSchema();
  const [row] = await sql<Row[]>`
    select i.*, ${usesSubquery()} as uses from invites i where i.code = ${code}`;
  return row ? toInvite(row) : null;
}

export const inviteAvailable = (i: Invite) => !i.revokedAt && i.uses < i.maxUses;

export async function createInvite(data: { name: string; email: string; note: string; maxUses: number; createdBy: string }): Promise<Invite> {
  await ensureSchema();
  const code = randomBytes(9).toString("base64url"); // 12 chars, seguro pra URL
  const [row] = await sql<Row[]>`
    insert into invites (code, name, email, note, max_uses, created_by)
    values (${code}, ${data.name}, ${data.email.toLowerCase()}, ${data.note}, ${data.maxUses}, ${data.createdBy})
    returning *, 0 as uses`;
  return toInvite(row);
}

export async function revokeInvite(id: string) {
  await ensureSchema();
  await sql`update invites set revoked_at = now() where id = ${id} and revoked_at is null`;
}

export async function reactivateInvite(id: string) {
  await ensureSchema();
  await sql`update invites set revoked_at = null where id = ${id}`;
}

// Só apaga convite sem inscrição associada (a FK é "restrict")
export async function deleteInvite(id: string) {
  await ensureSchema();
  await sql`delete from invites i where i.id = ${id} and not exists (select 1 from registrations r where r.invite_id = i.id)`;
}
