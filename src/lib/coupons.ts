import "server-only";
import { couponProblem, normalizeCouponCode, type CouponProblem, type CouponRules } from "@/lib/coupons-core";
import { ensureSchema, sql } from "@/lib/db";
import { isDiscountKind, NO_DISCOUNT, type InviteDiscount } from "@/lib/discounts";

export type Coupon = CouponRules & {
  id: string;
  code: string; // em maiúsculas
  description: string; // track / origem
  paid: number; // inscrições pagas com o cupom (sem as reprovadas)
  soldCents: number; // soma do valor pago nessas inscrições
  createdAt: string;
};

type Row = {
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
});

// Usos: mesma regra de vaga dos lotes (pagas + pagamentos abertos dentro do prazo, sem as reprovadas);
// vendido: só as pagas não reprovadas
const select = () => sql`
  select c.*,
    (select count(*) from registrations r where r.coupon_id = c.id and r.approval is distinct from 'rejected' and r.removed_at is null
      and (r.status = 'paid' or (r.status = 'pending' and coalesce(r.opa_expires_at, r.created_at + interval '1 hour') > now()))) as uses,
    (select count(*) from registrations r where r.coupon_id = c.id and r.status = 'paid' and r.approval is distinct from 'rejected' and r.removed_at is null) as paid,
    (select sum(r.amount_cents) from registrations r where r.coupon_id = c.id and r.status = 'paid' and r.approval is distinct from 'rejected' and r.removed_at is null) as sold_cents
  from coupons c`;

export async function listCoupons(): Promise<Coupon[]> {
  await ensureSchema();
  const rows = await sql<Row[]>`${select()} order by c.created_at desc`;
  return rows.map(toCoupon);
}

export async function getCouponByCode(raw: string): Promise<Coupon | null> {
  const code = normalizeCouponCode(raw);
  if (!code) return null;
  await ensureSchema();
  const [row] = await sql<Row[]>`${select()} where upper(c.code) = ${code}`;
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

// false: já existe outro cupom com o mesmo código
export async function saveCoupon(id: string | null, data: CouponData, userId: string): Promise<boolean> {
  await ensureSchema();
  const [clash] = await sql`select 1 from coupons where upper(code) = ${data.code} and id is distinct from ${id}::uuid`;
  if (clash) return false;
  if (id) {
    await sql`
      update coupons
      set code = ${data.code}, description = ${data.description}, discount_kind = ${data.discount.kind}, discount_value = ${data.discount.value},
          lot_ids = ${data.lotIds}::uuid[], max_uses = ${data.maxUses}, starts_at = ${data.startsAt}, ends_at = ${data.endsAt}, active = ${data.active}
      where id = ${id}`;
  } else {
    await sql`
      insert into coupons (code, description, discount_kind, discount_value, lot_ids, max_uses, starts_at, ends_at, active, created_by)
      values (${data.code}, ${data.description}, ${data.discount.kind}, ${data.discount.value}, ${data.lotIds}::uuid[], ${data.maxUses}, ${data.startsAt}, ${data.endsAt}, ${data.active}, ${userId})`;
  }
  return true;
}

export async function setCouponActive(id: string, active: boolean) {
  await ensureSchema();
  await sql`update coupons set active = ${active} where id = ${id}`;
}

// Cupom já usado não some (o painel e o CSV mostram de onde veio cada inscrição): desative em vez de apagar
export async function deleteCoupon(id: string) {
  await ensureSchema();
  await sql`delete from coupons c where c.id = ${id} and not exists (select 1 from registrations r where r.coupon_id = c.id)`;
}

export type CouponCheck = { ok: true; coupon: Coupon } | { ok: false; problem: CouponProblem; code: string };

// Cupom digitado (ou do link) para o lote à venda agora
export async function checkCoupon(raw: string, lotId: string | null): Promise<CouponCheck> {
  const code = normalizeCouponCode(raw);
  const coupon = await getCouponByCode(code);
  const problem = couponProblem(coupon, lotId);
  return problem || !coupon ? { ok: false, problem: problem ?? "not_found", code } : { ok: true, coupon };
}
