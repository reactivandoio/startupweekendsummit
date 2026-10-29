// pnpm test — cupons: validade, uso e combinação com o desconto do convite
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { couponProblem, couponProblemMessage, isValidCouponCode, normalizeCouponCode, parseEntry, quoteNote, registrationEntry, type CouponRules } from "./coupons-core.ts";
import { bestDiscount, NO_DISCOUNT } from "./discounts.ts";

const NOW = Date.parse("2026-11-10T15:00:00Z");
const coupon = (o: Partial<CouponRules> = {}): CouponRules => ({
  active: true,
  discount: { kind: "percent", value: 10 },
  lotIds: [],
  maxUses: null,
  uses: 0,
  startsAt: null,
  endsAt: null,
  ...o,
});

describe("código do cupom", () => {
  it("sem diferenciar maiúsculas e sem espaços", () => {
    assert.equal(normalizeCouponCode("  track-goiania "), "TRACK-GOIANIA");
    assert.equal(normalizeCouponCode("ab c"), "ABC");
  });
  it("letras, números, - e _, de 3 a 40", () => {
    assert.equal(isValidCouponCode("TRACK_2026"), true);
    assert.equal(isValidCouponCode("AB"), false);
    assert.equal(isValidCouponCode("CUPOM!"), false);
  });
});

describe("couponProblem", () => {
  it("válido em todos os lotes", () => {
    assert.equal(couponProblem(coupon(), "lote-1", NOW), null);
  });
  it("inexistente", () => {
    assert.equal(couponProblem(null, "lote-1", NOW), "not_found");
  });
  it("inativo", () => {
    assert.equal(couponProblem(coupon({ active: false }), "lote-1", NOW), "inactive");
  });
  it("antes do período", () => {
    assert.equal(couponProblem(coupon({ startsAt: "2026-11-11T00:00:00Z" }), "lote-1", NOW), "not_started");
  });
  it("expirado", () => {
    assert.equal(couponProblem(coupon({ endsAt: "2026-11-10T15:00:00Z" }), "lote-1", NOW), "expired");
  });
  it("esgotado pelo limite de usos", () => {
    assert.equal(couponProblem(coupon({ maxUses: 3, uses: 3 }), "lote-1", NOW), "exhausted");
    assert.equal(couponProblem(coupon({ maxUses: 3, uses: 2 }), "lote-1", NOW), null);
  });
  it("só nos lotes escolhidos", () => {
    assert.equal(couponProblem(coupon({ lotIds: ["lote-1", "lote-2"] }), "lote-2", NOW), null);
    assert.equal(couponProblem(coupon({ lotIds: ["lote-1"] }), "lote-3", NOW), "wrong_lot");
    assert.equal(couponProblem(coupon({ lotIds: ["lote-1"] }), null, NOW), "wrong_lot");
  });
  it("mensagem clara para cada problema", () => {
    assert.match(couponProblemMessage("expired", "TRACK"), /TRACK expirou/);
    assert.match(couponProblemMessage("wrong_lot", "TRACK"), /não vale para o lote/);
  });
});

describe("bestDiscount: convite e cupom não acumulam", () => {
  it("sem convite, vale o cupom", () => {
    assert.deepEqual(bestDiscount(35000, NO_DISCOUNT, { kind: "percent", value: 20 }), { listCents: 35000, discountCents: 7000, finalCents: 28000, courtesy: false, source: "coupon" });
  });
  it("vale o maior desconto, não a soma", () => {
    const r = bestDiscount(35000, { kind: "fixed", value: 10000 }, { kind: "percent", value: 20 });
    assert.equal(r.discountCents, 10000);
    assert.equal(r.source, "invite");
    assert.equal(bestDiscount(35000, { kind: "percent", value: 10 }, { kind: "percent", value: 30 }).source, "coupon");
  });
  it("empate fica com o convite", () => {
    assert.equal(bestDiscount(35000, { kind: "percent", value: 10 }, { kind: "fixed", value: 3500 }).source, "invite");
  });
  it("cupom só de rastreamento (0%) não dá desconto", () => {
    assert.deepEqual(bestDiscount(35000, NO_DISCOUNT, NO_DISCOUNT), { listCents: 35000, discountCents: 0, finalCents: 35000, courtesy: false, source: null });
  });
  it("cupom 100% deixa a inscrição gratuita", () => {
    const r = bestDiscount(35000, NO_DISCOUNT, { kind: "courtesy", value: 0 });
    assert.equal(r.finalCents, 0);
    assert.equal(r.courtesy, true);
    assert.equal(r.source, "coupon");
  });
});

describe("origem da inscrição", () => {
  it("convite, inscrição aberta ou link de cupom", () => {
    assert.equal(registrationEntry({ source: "invite", couponViaLink: true }), "invite");
    assert.equal(registrationEntry({ source: "open", couponViaLink: false }), "open");
    assert.equal(registrationEntry({ source: "open", couponViaLink: true }), "coupon_link");
  });
  it("filtro da URL", () => {
    assert.equal(parseEntry("coupon_link"), "coupon_link");
    assert.equal(parseEntry("x"), null);
  });
});

describe("quoteNote", () => {
  const track = { code: "TRACK", discount: { kind: "percent", value: 20 } } as const;
  it("explica o cupom aplicado", () => {
    assert.equal(quoteNote({ source: "coupon", discountCents: 7000 }, NO_DISCOUNT, track), "Cupom TRACK: 20% de desconto");
    assert.equal(quoteNote({ source: "coupon", discountCents: 35000 }, NO_DISCOUNT, { code: "FREE", discount: { kind: "courtesy", value: 0 } }), "Cupom FREE: 100% de desconto, ingresso gratuito");
  });
  it("avisa quando o desconto do convite é maior", () => {
    const note = quoteNote({ source: "invite", discountCents: 10000 }, { kind: "fixed", value: 10000 }, track);
    assert.match(note, /^Desconto do convite: R\$\s100,00 de desconto\. É maior que o do cupom TRACK/);
  });
  it("cupom só de rastreamento", () => {
    assert.equal(quoteNote({ source: null, discountCents: 0 }, NO_DISCOUNT, { code: "TRACK", discount: NO_DISCOUNT }), "Cupom TRACK aplicado.");
    assert.equal(quoteNote({ source: null, discountCents: 0 }, NO_DISCOUNT, null), "");
  });
});
