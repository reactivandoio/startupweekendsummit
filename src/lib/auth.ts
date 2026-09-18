import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ensureSchema, sql } from "@/lib/db";
import { sendLoginLink } from "@/lib/mail";

export type User = { id: string; email: string; name: string; createdAt: string };

const COOKIE = "sws_session";
const TOKEN_TTL_MIN = 15;
const SESSION_TTL_DAYS = 30;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const appUrl = () => (process.env.APP_URL ?? "http://localhost:3001").replace(/\/$/, "");

type UserRow = { id: string; email: string; name: string; created_at: Date };
const toUser = (r: UserRow): User => ({ id: r.id, email: r.email, name: r.name, createdAt: r.created_at.toISOString() });

/* ---------- Magic link ---------- */

// Só envia se o e-mail tiver acesso. Sempre resolve sem erro pra não revelar quem está cadastrado.
export async function requestLoginLink(rawEmail: string) {
  await ensureSchema();
  const email = rawEmail.trim().toLowerCase();
  const [user] = await sql<UserRow[]>`select * from users where email = ${email}`;
  if (!user) return;

  // um token válido por vez por e-mail
  await sql`delete from login_tokens where email = ${email}`;
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + TOKEN_TTL_MIN * 60_000);
  await sql`insert into login_tokens (token_hash, email, expires_at) values (${sha256(token)}, ${email}, ${expires})`;
  await sendLoginLink(email, `${appUrl()}/admin/auth?token=${token}`);
}

// Troca o token por uma sessão. Retorna false se inválido/expirado/usado.
export async function consumeLoginToken(token: string): Promise<boolean> {
  await ensureSchema();
  const [row] = await sql<{ email: string }[]>`
    update login_tokens set used_at = now()
    where token_hash = ${sha256(token)} and used_at is null and expires_at > now()
    returning email`;
  if (!row) return false;
  const [user] = await sql<UserRow[]>`select * from users where email = ${row.email}`;
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
    where s.id = ${id} and s.expires_at > now()`;
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

export async function listUsers(): Promise<User[]> {
  await ensureSchema();
  const rows = await sql<UserRow[]>`select * from users order by created_at asc`;
  return rows.map(toUser);
}

export async function addUser(email: string, name: string, invitedBy: string) {
  await ensureSchema();
  await sql`insert into users (email, name, invited_by) values (${email.trim().toLowerCase()}, ${name.trim()}, ${invitedBy})
            on conflict (email) do update set name = coalesce(nullif(excluded.name, ''), users.name)`;
}

export async function removeUser(id: string) {
  await ensureSchema();
  await sql`delete from users where id = ${id}`;
}
