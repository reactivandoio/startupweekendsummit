import "server-only";
import { site } from "@/content/site";
import { ensureSchema, sql } from "@/lib/db";
import { bestDiscount, type DiscountSource, type InviteDiscount, type PriceBreakdown } from "@/lib/discounts";
import { closedReason, lotOnSale, lotState, type LotState } from "@/lib/lots-core";
import { removedByName } from "@/lib/removal";
import { toRemoval, type Removal, type RemovalRow } from "@/lib/removal-core";
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
} & Removal;

type Row = RemovalRow & {
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
  return { ...lot, state: lotState(lot), ...toRemoval(r) };
};

// Mesma regra de vaga dos convites: pendente segura o lugar até o fim da cobrança atual (1h; nova cobrança na mesma
// inscrição renova) ou 1h da criação sem cobrança (Stripe). Igual a holdsSeat em payment-flow.ts.
// Conta desde o pagamento (mesmo em análise); reprovada devolve a vaga.
const soldSubquery = () => sql`
  (select count(*) from registrations r
    where r.lot_id = l.id
      and r.approval is distinct from 'rejected' and r.removed_at is null
      and (r.status = 'paid' or (r.status = 'pending' and coalesce(r.opa_expires_at, r.created_at + interval '1 hour') > now())))`;

// Removidos ficam fora da lista e da venda (currentOffer usa esta lista)
export async function listLots(): Promise<TicketLot[]> {
  await ensureSchema();
  const rows = await sql<Row[]>`
    select l.*, ${soldSubquery()} as sold from ticket_lots l where l.removed_at is null order by l.position, l.created_at`;
  return rows.map(toLot);
}

// Aba Removidos: mais recente primeiro
export async function listRemovedLots(): Promise<TicketLot[]> {
  await ensureSchema();
  const rows = await sql<Row[]>`
    select l.*, ${soldSubquery()} as sold, ${removedByName("l")} from ticket_lots l where l.removed_at is not null order by l.removed_at desc`;
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

// Exclusão lógica, só sem venda (nenhuma paga nem pagamento aberto, como o botão do painel); lote vendido se desativa.
// As inscrições antigas seguem mostrando de qual lote vieram.
export async function removeLot(id: string, userId: string): Promise<boolean> {
  await ensureSchema();
  const rows = await sql`
    update ticket_lots l set removed_at = now(), removed_by = ${userId}
    where l.id = ${id} and l.removed_at is null and ${soldSubquery()} = 0 returning l.id`;
  return rows.length > 0;
}

// Volta no fim da fila de venda, ativo ou não como estava
export async function restoreLot(id: string): Promise<boolean> {
  await ensureSchema();
  const rows = await sql`
    update ticket_lots set removed_at = null, removed_by = null,
      position = (select coalesce(max(position), 0) + 1 from ticket_lots where removed_at is null)
    where id = ${id} and removed_at is not null returning id`;
  return rows.length > 0;
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
