import "server-only";
import { checkCoupon, type Coupon } from "@/lib/coupons";
import { couponProblemMessage, normalizeCouponCode, quoteNote, type PriceQuote } from "@/lib/coupons-core";
import { bestDiscount, type InviteDiscount } from "@/lib/discounts";

export type Quote = { ok: true; quote: PriceQuote; coupon: Coupon | null } | { ok: false; message: string };

// Preço do checkout: preço de lista − o maior entre o desconto do convite e o do cupom. Mesma conta na página (link
// com ?cupom=), no "Aplicar" do formulário e no envio, que confere tudo de novo. Cupom vazio = sem cupom.
// lotId: lote do preço (o à venda agora, ou o que a inscrição retomada já segura).
export async function quotePrice(
  p: { listCents: number; lotId: string | null; minChargeCents: number },
  invite: InviteDiscount,
  couponRaw: string,
): Promise<Quote> {
  let coupon: Coupon | null = null;
  if (normalizeCouponCode(couponRaw)) {
    const check = await checkCoupon(couponRaw, p.lotId);
    if (!check.ok) return { ok: false, message: couponProblemMessage(check.problem, check.code) };
    coupon = check.coupon;
  }
  const price = bestDiscount(p.listCents, invite, coupon?.discount ?? null, p.minChargeCents);
  return { ok: true, coupon, quote: { ...price, couponCode: coupon?.code ?? null, note: quoteNote(price, invite, coupon) } };
}

// Página de inscrição (aberta ou convite) com o cupom do link (?cupom=CODIGO): preço já com o desconto e o código no
// campo. Cupom do link inválido não trava a página: mostra o preço sem ele e a mensagem no campo.
export async function pageQuote(
  ticket: { priceCents: number; lotId: string | null; minChargeCents: number },
  invite: InviteDiscount,
  cupom: string | string[] | undefined,
): Promise<{ quote: PriceQuote; linkCoupon: string | null; linkCouponError: string | null }> {
  const base = { listCents: ticket.priceCents, lotId: ticket.lotId, minChargeCents: ticket.minChargeCents };
  const linkCoupon = typeof cupom === "string" ? normalizeCouponCode(cupom).slice(0, 40) || null : null;
  const withCoupon = linkCoupon ? await quotePrice(base, invite, linkCoupon) : null;
  if (withCoupon?.ok) return { quote: withCoupon.quote, linkCoupon, linkCouponError: null };
  const plain = await quotePrice(base, invite, "");
  if (!plain.ok) throw new Error("preço sem cupom não deveria falhar");
  return { quote: plain.quote, linkCoupon, linkCouponError: withCoupon && !withCoupon.ok ? withCoupon.message : null };
}
