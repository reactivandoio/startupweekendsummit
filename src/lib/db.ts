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
      // Convites: cada link /inscricao/<code> libera max_uses inscrições pagas
      await sql`
        create table if not exists invites (
          id uuid primary key default gen_random_uuid(),
          code text not null unique,
          name text not null default '',
          email text not null default '',
          note text not null default '',
          max_uses int not null default 1,
          created_by uuid references users(id) on delete set null,
          created_at timestamptz not null default now(),
          revoked_at timestamptz
        )`;
      // Inscrições de participantes: nascem "pending" e viram "paid" pelo webhook do Stripe
      await sql`
        create table if not exists registrations (
          id uuid primary key default gen_random_uuid(),
          invite_id uuid not null references invites(id) on delete restrict,
          name text not null,
          email text not null,
          phone text not null,
          cpf text not null,
          birth_date date not null,
          status text not null default 'pending',
          amount_cents int not null default 0,
          stripe_session_id text unique,
          stripe_payment_intent text,
          created_at timestamptz not null default now(),
          paid_at timestamptz
        )`;
      await sql`create index if not exists registrations_invite_idx on registrations (invite_id, status)`;
      // Configurações editadas no painel (/admin/ingressos), como a chave do Opa Pingou
      await sql`
        create table if not exists settings (
          key text primary key,
          value text not null,
          updated_at timestamptz not null default now(),
          updated_by uuid references users(id) on delete set null
        )`;
      // Lotes de ingresso: o primeiro ativo (por posição) que ainda tem vaga é o que está à venda
      await sql`
        create table if not exists ticket_lots (
          id uuid primary key default gen_random_uuid(),
          name text not null,
          price_cents int not null,
          quantity int,
          active boolean not null default true,
          position int not null default 0,
          created_at timestamptz not null default now()
        )`;
      // Inscrições pagas pelo Opa Pingou (Pix): cobrança, copia e cola e prazo; Stripe continua para as antigas
      await sql`alter table registrations add column if not exists provider text not null default 'stripe'`;
      await sql`alter table registrations add column if not exists lot_id uuid references ticket_lots(id) on delete set null`;
      await sql`alter table registrations add column if not exists opa_charge_id text unique`;
      await sql`alter table registrations add column if not exists opa_br_code text`;
      await sql`alter table registrations add column if not exists opa_expires_at timestamptz`;
      // Desconto por convite (percent: % inteiro; fixed: centavos; courtesy: sem Pix, confirma direto)
      await sql`alter table invites add column if not exists discount_kind text not null default 'none'`;
      await sql`alter table invites add column if not exists discount_value int not null default 0`;
      // Na inscrição: preço do lote no momento e desconto aplicado; amount_cents segue sendo o valor pago
      await sql`alter table registrations add column if not exists list_price_cents int`;
      await sql`alter table registrations add column if not exists discount_cents int not null default 0`;
      // Consentimento opcional (LGPD art. 7º, I) para compartilhar nome, e-mail e WhatsApp com patrocinadores; null = não consentiu
      await sql`alter table registrations add column if not exists sponsor_consent_at timestamptz`;
      // Cadastro aberto (/inscricao/aberta): sem convite, entra "pending" na aprovação (approval null = convite, não passa por aprovação).
      // Reprovada paga é reembolsada à mão no Opa Pingou; refunded_at marca que já foi feito.
      await sql`alter table registrations alter column invite_id drop not null`;
      await sql`alter table registrations add column if not exists source text not null default 'invite'`;
      await sql`alter table registrations add column if not exists approval text`;
      await sql`alter table registrations add column if not exists reviewed_at timestamptz`;
      await sql`alter table registrations add column if not exists reviewed_by uuid references users(id) on delete set null`;
      await sql`alter table registrations add column if not exists refunded_at timestamptz`;
      // Cartão de crédito (link de pagamento do Opa Pingou/Abacate Pay): meio de pagamento ("pix" | "card"; null nas antigas)
      // e o link do checkout. review_reason: pagamento que chegou depois do prazo sem vaga ("sold_out") ou de quem já
      // tinha outra inscrição paga ("duplicate"); a inscrição entra em aprovação no painel.
      await sql`alter table registrations add column if not exists payment_method text`;
      await sql`alter table registrations add column if not exists opa_payment_link text`;
      await sql`alter table registrations add column if not exists review_reason text`;
      // Todas as cobranças de cada inscrição: quem abandona e volta (ou troca Pix ↔ cartão) ganha cobrança nova na mesma
      // inscrição, e a antiga continua pagável (o link do cartão não expira). O webhook acha a inscrição por qualquer uma;
      // paid_at marca a que pagou e duplicate_at a que foi paga depois dela (estorno manual no painel do Opa Pingou).
      await sql`
        create table if not exists opa_charges (
          id text primary key,
          registration_id uuid not null references registrations(id) on delete cascade,
          kind text not null,
          created_at timestamptz not null default now(),
          paid_at timestamptz,
          duplicate_at timestamptz,
          refunded_at timestamptz
        )`;
      await sql`create index if not exists opa_charges_registration_idx on opa_charges (registration_id)`;
      await sql`
        insert into opa_charges (id, registration_id, kind, created_at, paid_at)
        select opa_charge_id, id, case when opa_payment_link is null then 'PIX_QR' else 'PAYMENT_LINK' end, created_at,
               case when status = 'paid' then paid_at end
        from registrations where opa_charge_id is not null
        on conflict (id) do nothing`;
      // Webhooks do Opa Pingou já processados (o mesmo evento pode chegar mais de uma vez)
      await sql`
        create table if not exists opa_events (
          id text primary key,
          type text not null,
          received_at timestamptz not null default now()
        )`;
      // Patrocinadores do site: logo é o nome do arquivo no volume de uploads; position ordena dentro da categoria
      await sql`
        create table if not exists sponsors (
          id uuid primary key default gen_random_uuid(),
          name text not null,
          tier text not null,
          logo text not null,
          logo_alt text not null default '',
          url text not null default '',
          position int not null default 0,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
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
