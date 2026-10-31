import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ensureSchema, sql } from "@/lib/db";
import { sendLoginLink } from "@/lib/mail";
import { removedByName } from "@/lib/removal";
import { toRemoval, type Removal, type RemovalRow } from "@/lib/removal-core";

export type User = { id: string; email: string; name: string; createdAt: string } & Removal;

const COOKIE = "sws_session";
const TOKEN_TTL_MIN = 15;
const SESSION_TTL_DAYS = 30;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const appUrl = () => (process.env.APP_URL ?? "http://localhost:3001").replace(/\/$/, "");

type UserRow = RemovalRow & { id: string; email: string; name: string; created_at: Date };
const toUser = (r: UserRow): User => ({ id: r.id, email: r.email, name: r.name, createdAt: r.created_at.toISOString(), ...toRemoval(r) });

/* ---------- Magic link ---------- */

// Emite um link de entrada de uso único. Um token válido por vez por e-mail:
// pedir um novo invalida o anterior.
export async function createLoginUrl(email: string) {
  await ensureSchema();
  await sql`delete from login_tokens where email = ${email}`;
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + TOKEN_TTL_MIN * 60_000);
  await sql`insert into login_tokens (token_hash, email, expires_at) values (${sha256(token)}, ${email}, ${expires})`;
  return `${appUrl()}/admin/auth?token=${token}`;
}

export const loginPageUrl = () => `${appUrl()}/admin/login`;

// Só envia se o e-mail tiver acesso (removido não tem). Sempre resolve sem erro pra não revelar quem está cadastrado.
export async function requestLoginLink(rawEmail: string) {
  await ensureSchema();
  const email = rawEmail.trim().toLowerCase();
  const [user] = await sql<UserRow[]>`select * from users where email = ${email} and removed_at is null`;
  if (!user) return;
  await sendLoginLink(email, await createLoginUrl(email));
}

// Troca o token por uma sessão. Retorna false se inválido/expirado/usado.
export async function consumeLoginToken(token: string): Promise<boolean> {
  await ensureSchema();
  const [row] = await sql<{ email: string }[]>`
    update login_tokens set used_at = now()
    where token_hash = ${sha256(token)} and used_at is null and expires_at > now()
    returning email`;
  if (!row) return false;
  const [user] = await sql<UserRow[]>`select * from users where email = ${row.email} and removed_at is null`;
  if (!user) return false;

  const id = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);
  await sql`insert into sessions (id, user_id, expires_at) values (${id}, ${user.id}, ${expires})`;
  (await cookies()).set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
  return true;
}

/* ---------- Sessão ---------- */

export async function getCurrentUser(): Promise<User | null> {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;
  await ensureSchema();
  const [row] = await sql<UserRow[]>`
    select u.* from sessions s join users u on u.id = s.user_id
    where s.id = ${id} and s.expires_at > now() and u.removed_at is null`;
  return row ? toUser(row) : null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function logout() {
  const store = await cookies();
  const id = store.get(COOKIE)?.value;
  if (id) await sql`delete from sessions where id = ${id}`;
  store.delete(COOKIE);
}

/* ---------- Usuários com acesso ---------- */

// Quem tem acesso hoje (removidos: listRemovedUsers)
export async function listUsers(): Promise<User[]> {
  await ensureSchema();
  const rows = await sql<UserRow[]>`select * from users where removed_at is null order by created_at asc`;
  return rows.map(toUser);
}

// Aba Removidos: mais recente primeiro
export async function listRemovedUsers(): Promise<User[]> {
  await ensureSchema();
  const rows = await sql<UserRow[]>`
    select u.*, ${removedByName("u")} from users u where u.removed_at is not null order by u.removed_at desc`;
  return rows.map(toUser);
}

export async function getUser(id: string): Promise<User | null> {
  await ensureSchema();
  const [row] = await sql<UserRow[]>`select * from users where id = ${id} and removed_at is null`;
  return row ? toUser(row) : null;
}

// Devolve a pessoa cadastrada pra quem chamou poder mandar o convite de acesso. E-mail removido volta a ter acesso.
export async function addUser(email: string, name: string, invitedBy: string): Promise<User> {
  await ensureSchema();
  const [row] = await sql<UserRow[]>`insert into users (email, name, invited_by) values (${email.trim().toLowerCase()}, ${name.trim()}, ${invitedBy})
            on conflict (email) do update set name = coalesce(nullif(excluded.name, ''), users.name), removed_at = null, removed_by = null
            returning *`;
  return toUser(row);
}

// Exclusão lógica: perde o acesso na hora (as sessões abertas caem), mas o cadastro fica, com quem removeu e quando;
// as inscrições e convites que a pessoa revisou ou criou seguem com o nome dela.
export async function removeUser(id: string, removedBy: string): Promise<boolean> {
  await ensureSchema();
  return sql.begin(async (tx) => {
    const rows = await tx`update users set removed_at = now(), removed_by = ${removedBy} where id = ${id} and removed_at is null returning email`;
    if (rows.length === 0) return false;
    await tx`delete from sessions where user_id = ${id}`;
    await tx`delete from login_tokens where email = ${rows[0].email}`;
    return true;
  });
}

// Volta a ter acesso; entra de novo pelo link de /admin/login (ou "Reenviar convite")
export async function restoreUser(id: string): Promise<boolean> {
  await ensureSchema();
  const rows = await sql`update users set removed_at = null, removed_by = null where id = ${id} and removed_at is not null returning id`;
  return rows.length > 0;
}
