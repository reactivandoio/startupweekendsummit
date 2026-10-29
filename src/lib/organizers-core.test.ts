import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { initials, normalizeUrl, parseSocial, parseSocials, sanitizeSocials } from "./organizers-core.ts";

describe("normalizeUrl", () => {
  it("completa o https e mantém http(s)", () => {
    assert.equal(normalizeUrl("empresa.com.br"), "https://empresa.com.br/");
    assert.equal(normalizeUrl("http://empresa.com.br/x"), "http://empresa.com.br/x");
    assert.equal(normalizeUrl(""), "");
  });

  it("recusa outros protocolos e host sem domínio", () => {
    assert.equal(normalizeUrl("javascript:alert(1)"), null);
    assert.equal(normalizeUrl("ftp://empresa.com.br"), null);
    assert.equal(normalizeUrl("fulano"), null);
  });
});

describe("parseSocial", () => {
  it("aceita o domínio da rede, com ou sem www/subdomínio", () => {
    assert.deepEqual(parseSocial("linkedin", "linkedin.com/in/fulano"), { ok: true, url: "https://linkedin.com/in/fulano" });
    assert.deepEqual(parseSocial("linkedin", "https://br.linkedin.com/in/fulano"), { ok: true, url: "https://br.linkedin.com/in/fulano" });
    assert.deepEqual(parseSocial("x", "https://twitter.com/fulano"), { ok: true, url: "https://twitter.com/fulano" });
  });

  it("recusa link de outra rede no tipo errado", () => {
    const r = parseSocial("linkedin", "https://instagram.com/fulano");
    assert.equal(r.ok, false);
    assert.match(!r.ok ? r.message : "", /linkedin\.com/);
    // domínio parecido não engana
    assert.equal(parseSocial("instagram", "https://notinstagram.com/x").ok, false);
  });

  it("@usuario vira o perfil no Instagram e no X", () => {
    assert.deepEqual(parseSocial("instagram", "@fulano.dev"), { ok: true, url: "https://instagram.com/fulano.dev" });
    assert.deepEqual(parseSocial("x", "@fulano"), { ok: true, url: "https://x.com/fulano" });
    assert.equal(parseSocial("linkedin", "@fulano").ok, false);
  });

  it("site e outra aceitam qualquer domínio", () => {
    assert.deepEqual(parseSocial("site", "fulano.dev"), { ok: true, url: "https://fulano.dev/" });
    assert.deepEqual(parseSocial("outra", "https://github.com/fulano"), { ok: true, url: "https://github.com/fulano" });
  });
});

describe("parseSocials", () => {
  it("ignora linha vazia e mantém a ordem", () => {
    assert.deepEqual(parseSocials(["site", "linkedin", "x"], ["fulano.dev", "  ", "@fulano"]), {
      ok: true,
      socials: [
        { kind: "site", url: "https://fulano.dev/" },
        { kind: "x", url: "https://x.com/fulano" },
      ],
    });
  });

  it("falha com tipo desconhecido ou URL inválida", () => {
    assert.equal(parseSocials(["tiktok"], ["https://tiktok.com/@x"]).ok, false);
    assert.equal(parseSocials(["site"], ["nada"]).ok, false);
  });

  it("limita a quantidade", () => {
    const n = 9;
    assert.equal(parseSocials(Array(n).fill("site"), Array(n).fill("a.com")).ok, false);
  });
});

describe("sanitizeSocials", () => {
  it("descarta itens fora da forma", () => {
    assert.deepEqual(
      sanitizeSocials([{ kind: "site", url: "https://a.com/" }, { kind: "tiktok", url: "https://b.com" }, { kind: "x", url: "javascript:1" }, null]),
      [{ kind: "site", url: "https://a.com/" }],
    );
    assert.deepEqual(sanitizeSocials("x"), []);
  });
});

describe("initials", () => {
  it("primeira e última palavra", () => {
    assert.equal(initials("Maria da Silva Souza"), "MS");
    assert.equal(initials("pedro"), "P");
    assert.equal(initials("  "), "");
  });
});
