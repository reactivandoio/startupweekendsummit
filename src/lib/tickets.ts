import "server-only";
import { site } from "@/content/site";
import { ensureSchema, sql } from "@/lib/db";
import { bestDiscount, type DiscountSource, type InviteDiscount, type PriceBreakdown } from "@/lib/discounts";
import { closedReason, lotOnSale, lotState, type LotState } from "@/lib/lots-core";
import { getSetting } from "@/lib/settings";

export type TicketLot = {
  id: string;
  name: string;
  priceCents: number;
  quantity: number | null; // null = sem limite
  active: boolean;
  position: number;
  startsAt: string | null; // início das vendas; null = desde já
  endsAt: string | null; // fim das vendas; null = até esgotar
  sold: number; // pagas + checkouts abertos há menos de 1h
  state: LotState; // agora: inativo, agendado, à venda, encerrado por data ou esgotado
};

type Row = {
  id: string;
  name: string;
  price_cents: number;
  quantity: number | null;
  active: boolean;
  position: number;
  starts_at: Date | null;
  ends_at: Date | null;
  sold: number | string;
};

const toLot = (r: Row): TicketLot => {
  const lot = {
    id: r.id,
    name: r.name,
    priceCents: r.price_cents,
    quantity: r.quantity,
    active: r.active,
    position: r.position,
    startsAt: r.starts_at ? r.starts_at.toISOString() : null,
    endsAt: r.ends_at ? r.ends_at.toISOString() : null,
    sold: Number(r.sold),
  };
  return { ...lot, state: lotState(lot) };
};

// Mesma regra de vaga dos convites: pendente segura o lugar até o fim da cobrança atual (1h; nova cobrança na mesma
// inscrição renova) ou 1h da criação sem cobrança (Stripe). Igual a holdsSeat em payment-flow.ts.
// Conta desde o pagamento (mesmo em análise); reprovada devolve a vaga.
const soldSubquery = () => sql`
  (select count(*) from registrations r
    where r.lot_id = l.id
      and r.approval is distinct from 'rejected' and r.removed_at is null
      and (r.status = 'paid' or (r.status = 'pending' and coalesce(r.opa_expires_at, r.created_at + interval '1 hour') > now())))`;

export async function listLots(): Promise<TicketLot[]> {
  await ensureSchema();
  const rows = await sql<Row[]>`select l.*, ${soldSubquery()} as sold from ticket_lots l order by l.position, l.created_at`;
  return rows.map(toLot);
}

export type LotData = { name: string; priceCents: number; quantity: number | null; startsAt: string | null; endsAt: string | null };

export async function createLot(data: LotData) {
  await ensureSchema();
  await sql`
    insert into ticket_lots (name, price_cents, quantity, starts_at, ends_at, position)
    values (${data.name}, ${data.priceCents}, ${data.quantity}, ${data.startsAt}, ${data.endsAt}, (select coalesce(max(position), 0) + 1 from ticket_lots))`;
}

export async function updateLot(id: string, data: LotData & { active: boolean }) {
  await ensureSchema();
  await sql`
    update ticket_lots
    set name = ${data.name}, price_cents = ${data.priceCents}, quantity = ${data.quantity}, active = ${data.active},
        starts_at = ${data.startsAt}, ends_at = ${data.endsAt}
    where id = ${id}`;
}

// Troca de posição com o vizinho (setas ↑/↓ no painel)
export async function moveLot(id: string, direction: "up" | "down") {
  const lots = await listLots();
  const i = lots.findIndex((l) => l.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= lots.length) return;
  await sql.begin(async (tx) => {
    for (const [k, l] of lots.entries()) {
      const pos = k === i ? j : k === j ? i : k;
      await tx`update ticket_lots set position = ${pos} where id = ${l.id}`;
    }
  });
}

// Lote com inscrição associada não some: desative em vez de apagar
export async function deleteLot(id: string) {
  await ensureSchema();
  await sql`delete from ticket_lots l where l.id = ${id} and not exists (select 1 from registrations r where r.lot_id = l.id)`;
}

export type PaymentProvider = "opapingou" | "stripe";

// Menor cobrança aceita por cada meio (Stripe: R$ 0,50)
export const minChargeCents = (provider: PaymentProvider) => (provider === "stripe" ? 50 : 1);

export type TicketOffer =
  | { enabled: false; reason: "closed" | "sold_out"; name: string }
  | { enabled: true; provider: PaymentProvider; priceCents: number; lotId: string | null; lotName: string | null; name: string };

// O que está à venda agora. Opa Pingou (chave no painel) tem prioridade; sem ela, Stripe pelo .env.
// Preço: primeiro lote ativo, dentro do período e com vaga; sem lotes cadastrados, TICKET_PRICE_CENTS do .env.
export async function currentOffer(): Promise<TicketOffer> {
  const name = `Ingresso — ${site.name}`;
  const provider: PaymentProvider | null = (await getSetting("opapingou_api_key")) ? "opapingou" : process.env.STRIPE_SECRET_KEY ? "stripe" : null;
  if (!provider) return { enabled: false, reason: "closed", name };
  const minCents = minChargeCents(provider);

  const lots = await listLots();
  if (lots.length > 0) {
    const lot = lotOnSale(lots, minCents);
    if (!lot) return { enabled: false, reason: closedReason(lots), name };
    return { enabled: true, provider, priceCents: lot.priceCents, lotId: lot.id, lotName: lot.name, name: `${name} (${lot.name})` };
  }
  const priceCents = Number(process.env.TICKET_PRICE_CENTS ?? 0);
  if (!Number.isInteger(priceCents) || priceCents < minCents) return { enabled: false, reason: "closed", name };
  return { enabled: true, provider, priceCents, lotId: null, lotName: null, name };
}

// Preço da inscrição: lote à venda agora − o maior entre o desconto do convite e o do cupom (não acumulam)
export const offerPrice = (
  offer: Extract<TicketOffer, { enabled: true }>,
  invite: InviteDiscount,
  coupon: InviteDiscount | null = null,
): PriceBreakdown & { source: DiscountSource | null } => bestDiscount(offer.priceCents, invite, coupon, minChargeCents(offer.provider));
