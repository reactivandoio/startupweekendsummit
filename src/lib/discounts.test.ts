// pnpm test — regras do desconto por convite
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyDiscount, describeDiscount, discountInputValue, NO_DISCOUNT, parseDiscount } from "./discounts.ts";

describe("applyDiscount", () => {
  it("sem desconto cobra o preço do lote", () => {
    assert.deepEqual(applyDiscount(35000, NO_DISCOUNT), { listCents: 35000, discountCents: 0, finalCents: 35000, courtesy: false });
  });
  it("percentual sobre o preço do lote", () => {
    assert.deepEqual(applyDiscount(35000, { kind: "percent", value: 20 }), { listCents: 35000, discountCents: 7000, finalCents: 28000, courtesy: false });
  });
  it("percentual arredonda para o centavo mais próximo", () => {
    assert.equal(applyDiscount(999, { kind: "percent", value: 15 }).finalCents, 849); // 149,85 → 150 de desconto
  });
  it("valor fixo em reais", () => {
    assert.deepEqual(applyDiscount(35000, { kind: "fixed", value: 10000 }), { listCents: 35000, discountCents: 10000, finalCents: 25000, courtesy: false });
  });
  it("valor fixo maior que o lote nunca fica negativo e vira cortesia", () => {
    assert.deepEqual(applyDiscount(20000, { kind: "fixed", value: 50000 }), { listCents: 20000, discountCents: 20000, finalCents: 0, courtesy: true });
  });
  it("valor fixo igual ao lote vira cortesia", () => {
    assert.equal(applyDiscount(20000, { kind: "fixed", value: 20000 }).courtesy, true);
  });
  it("cortesia zera o valor", () => {
    assert.deepEqual(applyDiscount(35000, { kind: "courtesy", value: 0 }), { listCents: 35000, discountCents: 35000, finalCents: 0, courtesy: true });
  });
  it("100% é cortesia", () => {
    assert.equal(applyDiscount(35000, { kind: "percent", value: 100 }).courtesy, true);
  });
  it("o desconto acompanha o lote à venda no momento", () => {
    const d = { kind: "percent" as const, value: 50 };
    assert.equal(applyDiscount(30000, d).finalCents, 15000);
    assert.equal(applyDiscount(40000, d).finalCents, 20000);
  });
  it("resto abaixo do mínimo do meio de pagamento vira cortesia", () => {
    assert.deepEqual(applyDiscount(10000, { kind: "fixed", value: 9970 }, 50), { listCents: 10000, discountCents: 10000, finalCents: 0, courtesy: true });
    assert.equal(applyDiscount(10000, { kind: "fixed", value: 9970 }, 1).finalCents, 30);
  });
});

describe("parseDiscount", () => {
  it("sem desconto ignora o valor", () => {
    assert.deepEqual(parseDiscount("none", "50"), NO_DISCOUNT);
  });
  it("percentual inteiro de 1 a 100", () => {
    assert.deepEqual(parseDiscount("percent", "20"), { kind: "percent", value: 20 });
    assert.deepEqual(parseDiscount("percent", "15 %"), { kind: "percent", value: 15 });
    assert.equal(parseDiscount("percent", "0"), null);
    assert.equal(parseDiscount("percent", "101"), null);
    assert.equal(parseDiscount("percent", "12,5"), null);
    assert.equal(parseDiscount("percent", ""), null);
  });
  it("100% é gravado como cortesia", () => {
    assert.deepEqual(parseDiscount("percent", "100"), { kind: "courtesy", value: 0 });
  });
  it("valor fixo em reais vira centavos", () => {
    assert.deepEqual(parseDiscount("fixed", "R$ 1.234,56"), { kind: "fixed", value: 123456 });
    assert.deepEqual(parseDiscount("fixed", "50"), { kind: "fixed", value: 5000 });
    assert.equal(parseDiscount("fixed", "0"), null);
    assert.equal(parseDiscount("fixed", "abc"), null);
  });
  it("cortesia não precisa de valor", () => {
    assert.deepEqual(parseDiscount("courtesy", ""), { kind: "courtesy", value: 0 });
  });
});

describe("rótulos", () => {
  it("descreve cada tipo", () => {
    assert.equal(describeDiscount(NO_DISCOUNT), "Sem desconto");
    assert.equal(describeDiscount({ kind: "percent", value: 20 }), "20% de desconto");
    assert.equal(describeDiscount({ kind: "fixed", value: 5000 }).replace(/\s/g, " "), "R$ 50,00 de desconto");
    assert.equal(describeDiscount({ kind: "courtesy", value: 0 }), "Cortesia");
  });
  it("valor do campo de edição", () => {
    assert.equal(discountInputValue({ kind: "percent", value: 20 }), "20");
    assert.equal(discountInputValue({ kind: "fixed", value: 123456 }), "1234,56");
    assert.equal(discountInputValue(NO_DISCOUNT), "");
  });
});
