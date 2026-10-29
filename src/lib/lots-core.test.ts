// pnpm test — lote por data e quantidade
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { brasiliaInputValue, closedReason, describePeriod, lotOnSale, lotState, parseBrasiliaInput, type LotRules } from "./lots-core.ts";

const NOW = Date.parse("2026-11-10T15:00:00Z"); // 12:00 em Brasília
const lot = (o: Partial<LotRules & { id: string; priceCents: number }> = {}) => ({
  id: "a",
  priceCents: 35000,
  active: true,
  quantity: null,
  sold: 0,
  startsAt: null,
  endsAt: null,
  ...o,
});

describe("lotState", () => {
  it("ativo, sem datas e sem limite: à venda", () => {
    assert.equal(lotState(lot(), NOW), "on_sale");
  });
  it("inativo vence qualquer outra regra", () => {
    assert.equal(lotState(lot({ active: false, endsAt: "2026-11-01T00:00:00Z" }), NOW), "inactive");
  });
  it("antes do início: agendado", () => {
    assert.equal(lotState(lot({ startsAt: "2026-11-11T00:00:00Z" }), NOW), "scheduled");
  });
  it("no instante do início já vende", () => {
    assert.equal(lotState(lot({ startsAt: "2026-11-10T15:00:00Z" }), NOW), "on_sale");
  });
  it("no instante do fim já encerrou", () => {
    assert.equal(lotState(lot({ endsAt: "2026-11-10T15:00:00Z" }), NOW), "ended");
  });
  it("dentro do período e com vaga: à venda", () => {
    assert.equal(lotState(lot({ startsAt: "2026-11-01T00:00:00Z", endsAt: "2026-11-30T00:00:00Z", quantity: 10, sold: 9 }), NOW), "on_sale");
  });
  it("quantidade atingida: esgotado", () => {
    assert.equal(lotState(lot({ quantity: 10, sold: 10 }), NOW), "sold_out");
  });
  it("quantidade zero: esgotado", () => {
    assert.equal(lotState(lot({ quantity: 0 }), NOW), "sold_out");
  });
});

describe("lotOnSale", () => {
  it("primeiro lote à venda pela ordem", () => {
    const lots = [lot({ id: "1", endsAt: "2026-11-05T00:00:00Z" }), lot({ id: "2", quantity: 5, sold: 5 }), lot({ id: "3" }), lot({ id: "4" })];
    assert.equal(lotOnSale(lots, 1, NOW)?.id, "3");
  });
  it("passou a data do 1º: entra o próximo", () => {
    const lots = [lot({ id: "1", endsAt: "2026-11-10T14:59:00Z" }), lot({ id: "2", startsAt: "2026-11-10T14:59:00Z" })];
    assert.equal(lotOnSale(lots, 1, NOW)?.id, "2");
  });
  it("lote agendado não vende antes da hora", () => {
    assert.equal(lotOnSale([lot({ startsAt: "2026-12-01T00:00:00Z" })], 1, NOW), null);
  });
  it("lote abaixo da cobrança mínima do meio é pulado", () => {
    assert.equal(lotOnSale([lot({ id: "1", priceCents: 10 }), lot({ id: "2" })], 50, NOW)?.id, "2");
  });
});

describe("closedReason", () => {
  it("esgotado sem nenhum agendado", () => {
    assert.equal(closedReason([lot({ quantity: 1, sold: 1 }), lot({ endsAt: "2026-11-01T00:00:00Z" })], NOW), "sold_out");
  });
  it("esgotado mas com o próximo agendado: ainda não abriu", () => {
    assert.equal(closedReason([lot({ quantity: 1, sold: 1 }), lot({ startsAt: "2026-12-01T00:00:00Z" })], NOW), "closed");
  });
  it("só encerrados por data: fechado", () => {
    assert.equal(closedReason([lot({ endsAt: "2026-11-01T00:00:00Z" })], NOW), "closed");
  });
});

describe("datas em Brasília", () => {
  it("09:30 em Brasília é 12:30 UTC", () => {
    assert.equal(parseBrasiliaInput("2026-11-01T09:30"), "2026-11-01T12:30:00.000Z");
  });
  it("23:59 em Brasília vira o dia seguinte em UTC", () => {
    assert.equal(parseBrasiliaInput("2026-11-30T23:59"), "2026-12-01T02:59:00.000Z");
  });
  it("vazio é sem data; inválido é undefined", () => {
    assert.equal(parseBrasiliaInput("  "), null);
    assert.equal(parseBrasiliaInput("2026-02-30T10:00"), undefined);
    assert.equal(parseBrasiliaInput("01/11/2026 09:30"), undefined);
  });
  it("ida e volta pelo campo do painel", () => {
    assert.equal(brasiliaInputValue(parseBrasiliaInput("2026-11-01T09:30") ?? null), "2026-11-01T09:30");
    assert.equal(brasiliaInputValue(null), "");
  });
  it("período por extenso", () => {
    assert.equal(describePeriod("2026-11-01T12:30:00Z", null), "a partir de 01/11/2026, 09:30");
    assert.equal(describePeriod(null, null), "");
  });
});
