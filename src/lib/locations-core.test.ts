// pnpm test — estado e cidade da inscrição (lista do IBGE em public/municipios)
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { citiesPath, findCity, foldSearch, isUf, matchesSearch, placeLabel, resolvePlace, UFS, type City, type Uf } from "./locations-core.ts";

const cities = (uf: Uf): City[] => JSON.parse(readFileSync(path.join(process.cwd(), "public", citiesPath(uf)), "utf8"));
const lookup = async (uf: Uf, code: number) => findCity(cities(uf), code)?.[1] ?? null;

describe("lista do IBGE", () => {
  it("tem as 27 UFs, cada uma com o seu arquivo", () => {
    assert.equal(UFS.length, 27);
    const total = UFS.reduce((n, u) => n + cities(u.uf).length, 0);
    assert.ok(total >= 5570, `só ${total} municípios`);
  });
  it("todo código é de 7 dígitos e começa pelo código do estado", () => {
    for (const { uf } of UFS) {
      const list = cities(uf);
      const prefix = String(list[0][0]).slice(0, 2);
      for (const [code, name] of list) {
        assert.match(String(code), /^\d{7}$/);
        assert.equal(String(code).slice(0, 2), prefix, `${name}/${uf}`);
      }
    }
  });
  it("Brasília é a única do DF; Goiânia é de GO", () => {
    assert.deepEqual(cities("DF"), [[5300108, "Brasília"]]);
    assert.ok(findCity(cities("GO"), 5208707));
  });
});

describe("busca", () => {
  it("ignora acento, maiúsculas e espaços a mais", () => {
    assert.equal(foldSearch("  São  JOSÉ "), "sao jose");
    assert.ok(matchesSearch("São José dos Campos", "sao jose"));
    assert.ok(matchesSearch("Goiânia", "GOIAN"));
    assert.ok(matchesSearch("Aparecida de Goiânia", "goiania"));
    assert.ok(!matchesSearch("Anápolis", "goiania"));
    assert.ok(matchesSearch("Qualquer", ""));
  });
});

describe("resolvePlace", () => {
  it("tudo vazio é válido", async () => {
    assert.deepEqual(await resolvePlace({ company: "", uf: "", city: "" }, lookup), { ok: true, place: { company: "", uf: "", cityCode: null, cityName: "" } });
  });
  it("só empresa, ou só estado", async () => {
    assert.deepEqual(await resolvePlace({ company: "  Acme   Ltda ", uf: "", city: "" }, lookup), { ok: true, place: { company: "Acme Ltda", uf: "", cityCode: null, cityName: "" } });
    assert.deepEqual(await resolvePlace({ company: "", uf: "SP", city: "" }, lookup), { ok: true, place: { company: "", uf: "SP", cityCode: null, cityName: "" } });
  });
  it("cidade do estado grava código e nome oficial", async () => {
    assert.deepEqual(await resolvePlace({ company: "", uf: "GO", city: "5208707" }, lookup), { ok: true, place: { company: "", uf: "GO", cityCode: 5208707, cityName: "Goiânia" } });
  });
  it("cidade de outro estado, inválida ou sem estado é recusada", async () => {
    assert.deepEqual(await resolvePlace({ company: "", uf: "SP", city: "5208707" }, lookup), { ok: false, errors: { city: "Escolha uma cidade do estado selecionado." } });
    assert.deepEqual(await resolvePlace({ company: "", uf: "GO", city: "abc" }, lookup), { ok: false, errors: { city: "Escolha uma cidade do estado selecionado." } });
    assert.deepEqual(await resolvePlace({ company: "", uf: "", city: "5208707" }, lookup), { ok: false, errors: { uf: "Escolha o estado da cidade." } });
    assert.deepEqual(await resolvePlace({ company: "", uf: "XX", city: "" }, lookup), { ok: false, errors: { uf: "Estado inválido." } });
  });
  it("isUf só aceita a sigla em maiúsculas", () => {
    assert.ok(isUf("GO"));
    assert.ok(!isUf("go"));
    assert.ok(!isUf(undefined));
  });
});

describe("placeLabel", () => {
  it("cidade/UF, só UF ou vazio", () => {
    assert.equal(placeLabel({ uf: "GO", cityName: "Goiânia" }), "Goiânia/GO");
    assert.equal(placeLabel({ uf: "GO", cityName: "" }), "GO");
    assert.equal(placeLabel({ uf: "", cityName: "" }), "");
  });
});
