import "server-only";
import { couponProblem, normalizeCouponCode, type CouponProblem, type CouponRules } from "@/lib/coupons-core";
import { ensureSchema, sql } from "@/lib/db";
import { isDiscountKind, NO_DISCOUNT, type InviteDiscount } from "@/lib/discounts";
import { removedByName } from "@/lib/removal";
import { toRemoval, type Removal, type RemovalRow } from "@/lib/removal-core";

export type Coupon = CouponRules & {
  id: string;
  code: string; // em maiúsculas
  description: string; // track / origem
  paid: number; // inscrições pagas com o cupom (sem as reprovadas)
  soldCents: number; // soma do valor pago nessas inscrições
  createdAt: string;
} & Removal;

type Row = RemovalRow & {
  id: string;
  code: string;
  description: string;
  discount_kind: string;
  discount_value: number;
  lot_ids: string[];
  max_uses: number | null;
  starts_at: Date | null;
  ends_at: Date | null;
  active: boolean;
  created_at: Date;
  uses: number | string;
  paid: number | string;
  sold_cents: number | string | null;
};

const toCoupon = (r: Row): Coupon => ({
  id: r.id,
  code: r.code,
  description: r.description,
  discount: isDiscountKind(r.discount_kind) ? { kind: r.discount_kind, value: r.discount_value } : NO_DISCOUNT,
  lotIds: r.lot_ids ?? [],
  maxUses: r.max_uses,
  startsAt: r.starts_at ? r.starts_at.toISOString() : null,
  endsAt: r.ends_at ? r.ends_at.toISOString() : null,
  active: r.active,
  createdAt: r.created_at.toISOString(),
  uses: Number(r.uses),
  paid: Number(r.paid),
  soldCents: Number(r.sold_cents ?? 0),
  ...toRemoval(r),
});

// Usos: mesma regra de vaga dos lotes (pagas + pagamentos abertos dentro do prazo, sem as reprovadas);
// vendido: só as pagas não reprovadas
const usesSubquery = () => sql`
  (select count(*) from registrations r where r.coupon_id = c.id and r.approval is distinct from 'rejected' and r.removed_at is null
    and (r.status = 'paid' or (r.status = 'pending' and coalesce(r.opa_expires_at, r.created_at + interval '1 hour') > now())))`;
const paidSubquery = () => sql`
  (select count(*) from registrations r where r.coupon_id = c.id and r.status = 'paid' and r.approval is distinct from 'rejected' and r.removed_at is null)`;
const select = () => sql`
  select c.*, ${usesSubquery()} as uses, ${paidSubquery()} as paid,
    (select sum(r.amount_cents) from registrations r where r.coupon_id = c.id and r.status = 'paid' and r.approval is distinct from 'rejected' and r.removed_at is null) as sold_cents,
    ${removedByName("c")}
  from coupons c`;

// Removidos ficam fora da lista e do checkout (o código passa a dar "cupom não encontrado")
export async function listCoupons(): Promise<Coupon[]> {
  await ensureSchema();
  const rows = await sql<Row[]>`${select()} where c.removed_at is null order by c.created_at desc`;
  return rows.map(toCoupon);
}

// Aba Removidos: mais recente primeiro
export async function listRemovedCoupons(): Promise<Coupon[]> {
  await ensureSchema();
  const rows = await sql<Row[]>`${select()} where c.removed_at is not null order by c.removed_at desc`;
  return rows.map(toCoupon);
}

export async function getCouponByCode(raw: string): Promise<Coupon | null> {
  const code = normalizeCouponCode(raw);
  if (!code) return null;
  await ensureSchema();
  const [row] = await sql<Row[]>`${select()} where upper(c.code) = ${code} and c.removed_at is null`;
  return row ? toCoupon(row) : null;
}

export type CouponData = {
  code: string;
  description: string;
  discount: InviteDiscount;
  lotIds: string[];
  maxUses: number | null;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
};

// "taken": já existe outro cupom com o mesmo código; "taken_removed": é de um cupom removido (o código continua
// reservado pra ele poder ser restaurado)
export async function saveCoupon(id: string | null, data: CouponData, userId: string): Promise<"ok" | "taken" | "taken_removed"> {
  await ensureSchema();
  const [clash] = await sql<{ removed: boolean }[]>`
    select removed_at is not null as removed from coupons where upper(code) = ${data.code} and id is distinct from ${id}::uuid`;
  if (clash) return clash.removed ? "taken_removed" : "taken";
  if (id) {
    await sql`
      update coupons
      set code = ${data.code}, description = ${data.description}, discount_kind = ${data.discount.kind}, discount_value = ${data.discount.value},
          lot_ids = ${data.lotIds}::uuid[], max_uses = ${data.maxUses}, starts_at = ${data.startsAt}, ends_at = ${data.endsAt}, active = ${data.active}
      where id = ${id} and removed_at is null`;
  } else {
    await sql`
      insert into coupons (code, description, discount_kind, discount_value, lot_ids, max_uses, starts_at, ends_at, active, created_by)
      values (${data.code}, ${data.description}, ${data.discount.kind}, ${data.discount.value}, ${data.lotIds}::uuid[], ${data.maxUses}, ${data.startsAt}, ${data.endsAt}, ${data.active}, ${userId})`;
  }
  return "ok";
}

export async function setCouponActive(id: string, active: boolean) {
  await ensureSchema();
  await sql`update coupons set active = ${active} where id = ${id}`;
}

// Exclusão lógica, só sem uso (nenhuma paga nem pagamento aberto, como o botão do painel); cupom usado se desativa.
// As inscrições guardam o código, então o filtro por cupom em Participantes continua funcionando.
export async function removeCoupon(id: string, userId: string): Promise<boolean> {
  await ensureSchema();
  const rows = await sql`
    update coupons c set removed_at = now(), removed_by = ${userId}
    where c.id = ${id} and c.removed_at is null and ${usesSubquery()} = 0 and ${paidSubquery()} = 0 returning c.id`;
  return rows.length > 0;
}

// Volta como estava (ativo ou não), com o mesmo código e link
export async function restoreCoupon(id: string): Promise<boolean> {
  await ensureSchema();
  const rows = await sql`update coupons set removed_at = null, removed_by = null where id = ${id} and removed_at is not null returning id`;
  return rows.length > 0;
}

export type CouponCheck = { ok: true; coupon: Coupon } | { ok: false; problem: CouponProblem; code: string };

// Cupom digitado (ou do link) para o lote à venda agora
export async function checkCoupon(raw: string, lotId: string | null): Promise<CouponCheck> {
  const code = normalizeCouponCode(raw);
  const coupon = await getCouponByCode(code);
  const problem = couponProblem(coupon, lotId);
  return problem || !coupon ? { ok: false, problem: problem ?? "not_found", code } : { ok: true, coupon };
}
