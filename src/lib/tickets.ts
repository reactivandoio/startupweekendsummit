import "server-only";
import { site } from "@/content/site";
import { ensureSchema, sql } from "@/lib/db";
import { applyDiscount, type InviteDiscount, type PriceBreakdown } from "@/lib/discounts";
import { getSetting } from "@/lib/settings";

export type TicketLot = {
  id: string;
  name: string;
  priceCents: number;
  quantity: number | null; // null = sem limite
  active: boolean;
  position: number;
  sold: number; // pagas + checkouts abertos há menos de 1h
};

type Row = { id: string; name: string; price_cents: number; quantity: number | null; active: boolean; position: number; sold: number | string };

const toLot = (r: Row): TicketLot => ({
  id: r.id,
  name: r.name,
  priceCents: r.price_cents,
  quantity: r.quantity,
  active: r.active,
  position: r.position,
  sold: Number(r.sold),
});

// Mesma regra de vaga dos convites: pendente segura o lugar até o fim da cobrança atual (1h; nova cobrança na mesma
// inscrição renova) ou 1h da criação sem cobrança (Stripe). Igual a holdsSeat em payment-flow.ts.
// Cadastro aberto conta desde o pagamento (mesmo em análise); reprovada devolve a vaga.
const soldSubquery = () => sql`
  (select count(*) from registrations r
    where r.lot_id = l.id
      and r.approval is distinct from 'rejected'
      and (r.status = 'paid' or (r.status = 'pending' and coalesce(r.opa_expires_at, r.created_at + interval '1 hour') > now())))`;

export async function listLots(): Promise<TicketLot[]> {
  await ensureSchema();
  const rows = await sql<Row[]>`select l.*, ${soldSubquery()} as sold from ticket_lots l order by l.position, l.created_at`;
  return rows.map(toLot);
}

export const lotAvailable = (l: TicketLot) => l.active && (l.quantity === null || l.sold < l.quantity);

export async function createLot(data: { name: string; priceCents: number; quantity: number | null }) {
  await ensureSchema();
  await sql`
    insert into ticket_lots (name, price_cents, quantity, position)
    values (${data.name}, ${data.priceCents}, ${data.quantity}, (select coalesce(max(position), 0) + 1 from ticket_lots))`;
}

export async function updateLot(id: string, data: { name: string; priceCents: number; quantity: number | null; active: boolean }) {
  await ensureSchema();
  await sql`
    update ticket_lots set name = ${data.name}, price_cents = ${data.priceCents}, quantity = ${data.quantity}, active = ${data.active}
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
// Preço: lote atual; sem lotes cadastrados, TICKET_PRICE_CENTS do .env (ingresso único, como antes).
export async function currentOffer(): Promise<TicketOffer> {
  const name = `Ingresso — ${site.name}`;
  const provider: PaymentProvider | null = (await getSetting("opapingou_api_key")) ? "opapingou" : process.env.STRIPE_SECRET_KEY ? "stripe" : null;
  if (!provider) return { enabled: false, reason: "closed", name };
  const minCents = minChargeCents(provider);

  const lots = await listLots();
  if (lots.length > 0) {
    const lot = lots.find((l) => lotAvailable(l) && l.priceCents >= minCents);
    if (!lot) return { enabled: false, reason: lots.some((l) => l.active) ? "sold_out" : "closed", name };
    return { enabled: true, provider, priceCents: lot.priceCents, lotId: lot.id, lotName: lot.name, name: `${name} (${lot.name})` };
  }
  const priceCents = Number(process.env.TICKET_PRICE_CENTS ?? 0);
  if (!Number.isInteger(priceCents) || priceCents < minCents) return { enabled: false, reason: "closed", name };
  return { enabled: true, provider, priceCents, lotId: null, lotName: null, name };
}

// Preço para um convite: lote à venda agora − desconto do convite
export const offerPrice = (offer: Extract<TicketOffer, { enabled: true }>, discount: InviteDiscount): PriceBreakdown =>
  applyDiscount(offer.priceCents, discount, minChargeCents(offer.provider));
