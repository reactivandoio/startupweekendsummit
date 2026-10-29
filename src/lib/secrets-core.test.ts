// pnpm test — criptografia dos segredos em settings (STA-23)
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";
import { decryptSecret, encryptSecret, isEncrypted, maskSecret, migratedSecret, parseEncryptionKey, sealSecret } from "./secrets-core.ts";

const key = randomBytes(32);
const apiKey = "opk_live_" + "a".repeat(43);

describe("parseEncryptionKey", () => {
  it("aceita 32 bytes em base64", () => {
    const parsed = parseEncryptionKey(key.toString("base64"));
    assert.equal(parsed.state, "ok");
    assert.ok(parsed.key?.equals(key));
  });
  it("variável ausente ou vazia", () => {
    assert.equal(parseEncryptionKey(undefined).state, "missing");
    assert.equal(parseEncryptionKey("  ").state, "missing");
  });
  it("tamanho errado é inválida, sem chave", () => {
    const parsed = parseEncryptionKey(randomBytes(16).toString("base64"));
    assert.equal(parsed.state, "invalid");
    assert.equal(parsed.key, null);
  });
});

describe("cifrar e decifrar", () => {
  it("ida e volta", () => {
    const enc = encryptSecret(apiKey, key, "opapingou_api_key");
    assert.ok(isEncrypted(enc));
    assert.ok(!enc.includes(apiKey));
    assert.equal(decryptSecret(enc, key, "opapingou_api_key"), apiKey);
  });
  it("IV novo a cada vez", () => {
    assert.notEqual(encryptSecret(apiKey, key, "k"), encryptSecret(apiKey, key, "k"));
  });
  it("chave errada, outra linha (AAD) ou adulterado não abrem", () => {
    const enc = encryptSecret(apiKey, key, "opapingou_api_key");
    assert.equal(decryptSecret(enc, randomBytes(32), "opapingou_api_key"), null);
    assert.equal(decryptSecret(enc, key, "opapingou_webhook_secret"), null);
    const tampered = enc.slice(0, -2) + (enc.endsWith("A") ? "B" : "A") + enc.slice(-1);
    assert.equal(decryptSecret(tampered, key, "opapingou_api_key"), null);
    assert.equal(decryptSecret("enc:v1:lixo", key, "opapingou_api_key"), null);
  });
  it("texto puro antigo é lido como está", () => {
    assert.equal(decryptSecret(apiKey, key, "opapingou_api_key"), apiKey);
    assert.equal(decryptSecret(apiKey, null, "opapingou_api_key"), apiKey);
  });
});

describe("variável ausente", () => {
  it("grava em texto puro, como antes", () => {
    assert.equal(sealSecret(apiKey, null, "opapingou_api_key"), apiKey);
  });
  it("cifrado sem a chave não abre (e não lança)", () => {
    assert.equal(decryptSecret(encryptSecret(apiKey, key, "k"), null, "k"), null);
  });
});

describe("migração", () => {
  it("cifra o texto puro e é idempotente", () => {
    const first = migratedSecret(apiKey, key, "opapingou_api_key");
    assert.ok(first && isEncrypted(first));
    assert.equal(decryptSecret(first, key, "opapingou_api_key"), apiKey);
    assert.equal(migratedSecret(first, key, "opapingou_api_key"), null);
  });
  it("sem chave não migra", () => {
    assert.equal(migratedSecret(apiKey, null, "opapingou_api_key"), null);
  });
});

describe("maskSecret", () => {
  it("mostra só as pontas", () => {
    const masked = maskSecret("whsec_Zx3kQ8mT1vN7pR5sB2cD9fG4hJ6wY0aL");
    assert.equal(masked, "whse…Y0aL");
    assert.ok(!masked.includes("Zx3kQ8"));
  });
  it("curto demais não mostra nada", () => {
    assert.equal(maskSecret("abc123"), "••••");
  });
});
