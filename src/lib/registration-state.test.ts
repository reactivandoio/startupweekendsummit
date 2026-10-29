// pnpm test — situação da inscrição (pagamento + aprovação do cadastro aberto)
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formPath, isConfirmed, matchesFilters, parseSituation, parseSource, paymentMethodName, paymentPagePath, situation } from "./registration-state.ts";

describe("situation", () => {
  it("convite pago é confirmado direto, sem aprovação", () => {
    assert.equal(situation({ status: "paid", approval: null }), "confirmed");
  });
  it("cadastro aberto pago aguarda aprovação", () => {
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
  const open = { status: "paid", approval: "pending", source: "open" } as const;
  const invite = { status: "paid", approval: null, source: "invite" } as const;
  it("sem filtro passa tudo", () => {
    assert.ok(matchesFilters(open, { situation: null, source: null }));
    assert.ok(matchesFilters(invite, { situation: null, source: null }));
  });
  it("filtra por situação e por origem juntos", () => {
    assert.ok(matchesFilters(open, { situation: "awaiting_approval", source: "open" }));
    assert.ok(!matchesFilters(open, { situation: "awaiting_approval", source: "invite" }));
    assert.ok(!matchesFilters(invite, { situation: "awaiting_approval", source: null }));
  });
  it("valores desconhecidos na URL viram 'todos'", () => {
    assert.equal(parseSituation("x"), null);
    assert.equal(parseSituation(undefined), null);
    assert.equal(parseSituation("rejected"), "rejected");
    assert.equal(parseSource(["open"]), null);
    assert.equal(parseSource("open"), "open");
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
  });
  it("manda para a página do Pix ou do cartão", () => {
    assert.equal(paymentPagePath({ id: "x", opaPaymentLink: null }), "/inscricao/pix/x");
    assert.equal(paymentPagePath({ id: "x", opaPaymentLink: "https://pay" }), "/inscricao/cartao/x");
  });
});
