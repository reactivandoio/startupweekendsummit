import "server-only";
import postgres from "postgres";

// Cliente único por processo. DATABASE_URL vem do compose (prod) ou do .env (dev).
const globalForDb = globalThis as unknown as { __sql?: postgres.Sql; __schemaReady?: Promise<void> };

export const sql =
  globalForDb.__sql ??
  postgres(process.env.DATABASE_URL ?? "postgres://sws:sws@127.0.0.1:5435/sws", {
    max: 5,
    idle_timeout: 30,
    onnotice: () => {},
  });
if (process.env.NODE_ENV !== "production") globalForDb.__sql = sql;

// Schema idempotente + seed do primeiro admin. Roda uma vez por processo, no primeiro acesso ao banco.
export function ensureSchema() {
  if (!globalForDb.__schemaReady) {
    globalForDb.__schemaReady = (async () => {
      await sql`
        create table if not exists users (
          id uuid primary key default gen_random_uuid(),
          email text not null unique,
          name text not null default '',
          created_at timestamptz not null default now(),
          invited_by uuid references users(id) on delete set null
        )`;
      await sql`
        create table if not exists login_tokens (
          token_hash text primary key,
          email text not null,
          expires_at timestamptz not null,
          used_at timestamptz
        )`;
      await sql`
        create table if not exists sessions (
          id text primary key,
          user_id uuid not null references users(id) on delete cascade,
          created_at timestamptz not null default now(),
          expires_at timestamptz not null
        )`;
      await sql`
        create table if not exists volunteers (
          id uuid primary key default gen_random_uuid(),
          name text not null,
          email text not null unique,
          phone text not null,
          city text not null,
          area text not null,
          availability text[] not null default '{}',
          experience text not null default 'nao',
          motivation text not null default '',
          created_at timestamptz not null default now()
        )`;
      const seed = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
      if (seed) {
        await sql`insert into users (email, name) values (${seed}, ${process.env.ADMIN_SEED_NAME ?? ""}) on conflict (email) do nothing`;
      }
    })().catch((err) => {
      globalForDb.__schemaReady = undefined;
      throw err;
    });
  }
  return globalForDb.__schemaReady;
}
