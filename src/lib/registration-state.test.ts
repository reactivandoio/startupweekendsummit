// pnpm test — situação da inscrição (pagamento + aprovação do cadastro aberto)
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formPath, isConfirmed, matchesFilters, parseCouponFilter, parseSituation, paymentMethodName, paymentPagePath, situation } from "./registration-state.ts";

describe("situation", () => {
  it("convite antigo (sem aprovação) pago é confirmado", () => {
    assert.equal(situation({ status: "paid", approval: null }), "confirmed");
  });
  it("toda inscrição nova paga (ou gratuita) aguarda aprovação", () => {
    assert.equal(situation({ status: "paid", approval: "pending" }), "awaiting_approval");
    assert.equal(isConfirmed({ status: "paid", approval: "pending" }), false);
  });
  it("aprovado e pago é confirmado", () => {
    assert.equal(situation({ status: "paid", approval: "approved" }), "confirmed");
  });
  it("reprovado vale mesmo pago", () => {
    assert.equal(situation({ status: "paid", approval: "rejected" }), "rejected");
  });
  it("sem pagamento: aguardando ou não paga, com ou sem aprovação pendente", () => {
    assert.equal(situation({ status: "pending", approval: "pending" }), "awaiting_payment");
    assert.equal(situation({ status: "pending", approval: null }), "awaiting_payment");
    assert.equal(situation({ status: "expired", approval: "pending" }), "unpaid");
    assert.equal(situation({ status: "canceled", approval: null }), "unpaid");
  });
});

describe("filtros", () => {
  const open = { status: "paid", approval: "pending", source: "open", couponViaLink: false, couponCode: null } as const;
  const viaLink = { status: "paid", approval: "pending", source: "open", couponViaLink: true, couponCode: "TRACK" } as const;
  const invite = { status: "paid", approval: null, source: "invite", couponViaLink: false, couponCode: "TRACK" } as const;
  const none = { situation: null, entry: null, coupon: null };
  it("sem filtro passa tudo", () => {
    assert.ok(matchesFilters(open, none));
    assert.ok(matchesFilters(invite, none));
  });
  it("filtra por situação e por origem juntos", () => {
    assert.ok(matchesFilters(open, { ...none, situation: "awaiting_approval", entry: "open" }));
    assert.ok(!matchesFilters(open, { ...none, situation: "awaiting_approval", entry: "invite" }));
    assert.ok(!matchesFilters(invite, { ...none, situation: "awaiting_approval" }));
  });
  it("link de cupom é uma origem própria", () => {
    assert.ok(matchesFilters(viaLink, { ...none, entry: "coupon_link" }));
    assert.ok(!matchesFilters(viaLink, { ...none, entry: "open" }));
  });
  it("filtra por cupom, ou pelas sem cupom", () => {
    assert.ok(matchesFilters(invite, { ...none, coupon: "TRACK" }));
    assert.ok(!matchesFilters(open, { ...none, coupon: "TRACK" }));
    assert.ok(matchesFilters(open, { ...none, coupon: "-" }));
    assert.ok(!matchesFilters(viaLink, { ...none, coupon: "-" }));
  });
  it("valores desconhecidos na URL viram 'todos'", () => {
    assert.equal(parseSituation("x"), null);
    assert.equal(parseSituation(undefined), null);
    assert.equal(parseSituation("rejected"), "rejected");
    assert.equal(parseCouponFilter(["TRACK"]), null);
    assert.equal(parseCouponFilter("track"), "TRACK");
    assert.equal(parseCouponFilter("a b"), null);
  });
});

describe("formPath", () => {
  it("volta ao convite ou à página aberta", () => {
    assert.equal(formPath({ source: "invite", inviteCode: "abc" }), "/inscricao/abc");
    assert.equal(formPath({ source: "open", inviteCode: "" }), "/inscricao/aberta");
  });
});

describe("meio de pagamento", () => {
  it("usa o gravado na inscrição e cai no provedor nas antigas", () => {
    assert.equal(paymentMethodName({ provider: "opapingou", paymentMethod: "card" }), "Cartão de crédito");
    assert.equal(paymentMethodName({ provider: "opapingou", paymentMethod: "pix" }), "Pix");
    assert.equal(paymentMethodName({ provider: "opapingou", paymentMethod: null }), "Pix");
    assert.equal(paymentMethodName({ provider: "stripe", paymentMethod: null }), "Cartão (Stripe)");
    assert.equal(paymentMethodName({ provider: "courtesy", paymentMethod: null }), "Cortesia");
    assert.equal(paymentMethodName({ provider: "courtesy", paymentMethod: null, discountSource: "coupon" }), "Gratuita (cupom)");
  });
  it("manda para a página do Pix ou do cartão", () => {
    assert.equal(paymentPagePath({ id: "x", opaPaymentLink: null }), "/inscricao/pix/x");
    assert.equal(paymentPagePath({ id: "x", opaPaymentLink: "https://pay" }), "/inscricao/cartao/x");
  });
});
