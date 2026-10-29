// pnpm test — retomada da inscrição abandonada, troca Pix ↔ cartão e pagamento em dobro
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HOLD_MS, holdsSeat, paidChargeOutcome, resumePlan } from "./payment-flow.ts";

const now = Date.parse("2026-11-01T12:00:00Z");
const ago = (ms: number) => new Date(now - ms).toISOString();
const ahead = (ms: number) => new Date(now + ms).toISOString();

describe("holdsSeat", () => {
  it("pendente dentro do prazo da cobrança segura a vaga", () => {
    assert.equal(holdsSeat({ status: "pending", createdAt: ago(10 * 60_000), opaExpiresAt: ahead(50 * 60_000) }, now), true);
  });
  it("prazo da cobrança vencido, expirada ou paga não seguram", () => {
    assert.equal(holdsSeat({ status: "pending", createdAt: ago(70 * 60_000), opaExpiresAt: ago(10 * 60_000) }, now), false);
    assert.equal(holdsSeat({ status: "expired", createdAt: ago(1000), opaExpiresAt: ahead(1000) }, now), false);
    assert.equal(holdsSeat({ status: "paid", createdAt: ago(1000), opaExpiresAt: ahead(1000) }, now), false);
  });
  it("nova cobrança na mesma inscrição renova o prazo (vale o expiresAt, não a criação)", () => {
    assert.equal(holdsSeat({ status: "pending", createdAt: ago(3 * HOLD_MS), opaExpiresAt: ahead(30 * 60_000) }, now), true);
  });
  it("sem cobrança (Stripe): 1h da criação", () => {
    assert.equal(holdsSeat({ status: "pending", createdAt: ago(HOLD_MS - 1000), opaExpiresAt: null }, now), true);
    assert.equal(holdsSeat({ status: "pending", createdAt: ago(HOLD_MS + 1000), opaExpiresAt: null }, now), false);
  });
});

describe("resumePlan (voltou ao formulário com inscrição não paga)", () => {
  const open = { status: "pending", createdAt: ago(5 * 60_000), opaExpiresAt: ahead(55 * 60_000) };
  it("mesmo meio e cobrança valendo: retoma a mesma página, sem cobrança nova", () => {
    assert.equal(resumePlan({ ...open, paymentMethod: "pix" }, "pix", now), "reuse");
    assert.equal(resumePlan({ ...open, paymentMethod: "card" }, "card", now), "reuse");
  });
  it("trocou de meio: nova cobrança na mesma inscrição", () => {
    assert.equal(resumePlan({ ...open, paymentMethod: "pix" }, "card", now), "new_charge");
    assert.equal(resumePlan({ ...open, paymentMethod: "card" }, "pix", now), "new_charge");
  });
  it("Pix expirado ou cancelado: gera um novo", () => {
    assert.equal(resumePlan({ status: "expired", createdAt: ago(2 * HOLD_MS), opaExpiresAt: ago(HOLD_MS), paymentMethod: "pix" }, "pix", now), "new_charge");
    assert.equal(resumePlan({ status: "canceled", createdAt: ago(1000), opaExpiresAt: ahead(1000), paymentMethod: "pix" }, "pix", now), "new_charge");
  });
  it("inscrição antiga sem meio gravado conta como Pix", () => {
    assert.equal(resumePlan({ ...open, paymentMethod: null }, "pix", now), "reuse");
  });
});

describe("paidChargeOutcome (charge.paid de uma das cobranças)", () => {
  it("inscrição não paga: confirma, mesmo por uma cobrança antiga", () => {
    assert.equal(paidChargeOutcome({ status: "pending" }, "ch_antiga", null), "apply");
    assert.equal(paidChargeOutcome({ status: "expired" }, "ch_antiga", null), "apply");
  });
  it("mesma cobrança que já confirmou: nada a fazer (webhook repetido)", () => {
    assert.equal(paidChargeOutcome({ status: "paid" }, "ch_pix", "ch_pix"), "noop");
  });
  it("Pix pago e depois o link do cartão: pagamento em dobro, para estorno", () => {
    assert.equal(paidChargeOutcome({ status: "paid" }, "ch_cartao", "ch_pix"), "duplicate");
  });
});
