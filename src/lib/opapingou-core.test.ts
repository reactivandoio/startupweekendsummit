// pnpm test — roteiro de testes do guia do Opa Pingou (item 4: verificação de assinatura) e utilitários
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  chargeDescription,
  chargeEventStatus,
  methodFromKind,
  methodFromPayment,
  duplicateWebhooks,
  isOpaApiKey,
  isOpaTestKey,
  maskOpaKey,
  parseOpaEvent,
  planWebhookSetup,
  sameWebhookUrl,
  signOpaPayload,
  verifyOpaSignature,
} from "./opapingou-core.ts";

const secret = "whsec_Zx3kQ8mT1vN7pR5sB2cD9fG4hJ6wY0aL";
const body = JSON.stringify({
  id: "e6f7a8b9-0c1d-4e2f-83a4-b5c6d7e8f9a0",
  type: "charge.paid",
  occurredAt: "2026-10-03T14:32:00.000Z",
  testMode: true,
  data: { type: "charge", object: { id: "9a8b7c6d-5e4f-4321-a0b1-c2d3e4f5a6b7", status: "PAID", amountCents: 35000 } },
});
const now = 1_791_037_920_000;
const t = now / 1000;
const header = (ts = t, sig = signOpaPayload(body, ts, secret)) => `t=${ts},v1=${sig}`;

describe("verifyOpaSignature", () => {
  it("aceita assinatura válida", () => {
    assert.equal(verifyOpaSignature(body, header(), secret, now), true);
  });
  it("aceita hex em maiúsculas e espaços entre as partes", () => {
    assert.equal(verifyOpaSignature(body, `t=${t}, v1=${signOpaPayload(body, t, secret).toUpperCase()}`, secret, now), true);
  });
  it("rejeita corpo alterado", () => {
    assert.equal(verifyOpaSignature(body.replace("35000", "1"), header(), secret, now), false);
  });
  it("rejeita segredo errado", () => {
    assert.equal(verifyOpaSignature(body, header(), "whsec_outro", now), false);
  });
  it("rejeita t com mais de 300 s de diferença, para os dois lados", () => {
    assert.equal(verifyOpaSignature(body, header(t - 301), secret, now), false);
    assert.equal(verifyOpaSignature(body, header(t + 301), secret, now), false);
    assert.equal(verifyOpaSignature(body, header(t - 300), secret, now), true);
  });
  it("rejeita cabeçalho ausente ou malformado", () => {
    assert.equal(verifyOpaSignature(body, null, secret, now), false);
    assert.equal(verifyOpaSignature(body, "v1=abc", secret, now), false);
    assert.equal(verifyOpaSignature(body, `t=${t}`, secret, now), false);
    assert.equal(verifyOpaSignature(body, `t=${t},v1=abc`, secret, now), false);
  });
});

describe("parseOpaEvent", () => {
  it("lê o evento de cobrança", () => {
    const e = parseOpaEvent(body);
    assert.equal(e?.type, "charge.paid");
    assert.equal(e?.data.object.id, "9a8b7c6d-5e4f-4321-a0b1-c2d3e4f5a6b7");
    assert.equal(chargeEventStatus[e!.type], "paid");
  });
  it("ignora o que não é evento", () => {
    assert.equal(parseOpaEvent("não é json"), null);
    assert.equal(parseOpaEvent(JSON.stringify({ id: "x", type: "ping" })), null);
  });
  it("ping e eventos de pagamento não mudam inscrição", () => {
    assert.equal(chargeEventStatus["ping"], undefined);
    assert.equal(chargeEventStatus["payment.confirmed"], undefined);
  });
});

describe("chave de API", () => {
  const live = `opk_live_${"a".repeat(43)}`;
  const test = `opk_test_${"B".repeat(40)}-_9`;
  it("valida o formato", () => {
    assert.equal(isOpaApiKey(live), true);
    assert.equal(isOpaApiKey(test), true);
    assert.equal(isOpaApiKey(`opk_live_${"a".repeat(42)}`), false);
    assert.equal(isOpaApiKey(`sk_live_${"a".repeat(43)}`), false);
  });
  it("identifica teste e mascara", () => {
    assert.equal(isOpaTestKey(test), true);
    assert.equal(isOpaTestKey(live), false);
    assert.equal(maskOpaKey(live), "opk_live_…aaaa");
  });
});

describe("webhooks duplicados", () => {
  const url = "https://startupweekendsummit.com.br/api/opapingou/webhook";
  const saved = { id: "d5cd93df", url, status: "ACTIVE" as const };
  const manual = { id: "616925d6", url: `${url}/`, status: "DISABLED" as const };
  const other = { id: "4d1b83ab", url: "https://bff.hubcommunity.io/webhooks/opapingou", status: "ACTIVE" as const };

  it("compara URL sem caixa do host nem barra no fim", () => {
    assert.equal(sameWebhookUrl(url, "https://StartupWeekendSummit.com.br/api/opapingou/webhook/"), true);
    assert.equal(sameWebhookUrl(url, "https://startupweekendsummit.com.br/api/opapingou/webhook2"), false);
    assert.equal(sameWebhookUrl(url, "http://startupweekendsummit.com.br/api/opapingou/webhook"), false);
  });
  it("aponta como duplicado só o que tem a URL do site e não é o salvo", () => {
    assert.deepEqual(duplicateWebhooks([saved, manual, other], url, saved.id).map((e) => e.id), ["616925d6"]);
    assert.deepEqual(duplicateWebhooks([saved, other], url, saved.id), []);
  });
  it("sem webhook salvo, todo endpoint da URL é duplicado", () => {
    assert.deepEqual(duplicateWebhooks([saved, manual, other], url, null).map((e) => e.id), ["d5cd93df", "616925d6"]);
  });
  it("com o salvo existindo, troca o segredo dele em vez de criar", () => {
    assert.deepEqual(planWebhookSetup([manual, saved, other], url, saved.id), { action: "rotate", id: "d5cd93df", status: "ACTIVE" });
  });
  it("sem salvo, adota o endpoint ativo da URL", () => {
    assert.deepEqual(planWebhookSetup([manual, saved, other], url, null), { action: "rotate", id: "d5cd93df", status: "ACTIVE" });
  });
  it("salvo que sumiu: adota o que existir para a URL, mesmo desativado", () => {
    assert.deepEqual(planWebhookSetup([manual, other], url, "apagado"), { action: "rotate", id: "616925d6", status: "DISABLED" });
  });
  it("cria só quando a conta não tem endpoint para a URL", () => {
    assert.deepEqual(planWebhookSetup([other], url, null), { action: "create" });
    assert.deepEqual(planWebhookSetup([], url, "apagado"), { action: "create" });
  });
});

describe("descrição da cobrança", () => {
  it("tira acentos, troca travessão por hífen e corta em 100", () => {
    assert.equal(chargeDescription("Ingresso — Summit (Lote 1º) — João Conceição"), "Ingresso - Summit (Lote 1) - Joao Conceicao");
    assert.equal(chargeDescription("a – b"), "a - b");
    assert.equal(chargeDescription(`Ingresso — ${"x".repeat(200)}`).length, 100);
    assert.equal(chargeDescription("  muitos   espaços  "), "muitos espacos");
  });
});

describe("meio de pagamento", () => {
  it("vem do kind da cobrança e o pagamento confirma quando disponível", () => {
    assert.equal(methodFromKind("PIX_QR"), "pix");
    assert.equal(methodFromKind("PAYMENT_LINK"), "card");
    assert.equal(methodFromPayment("PIX", "card"), "pix"); // link do Abacate pago por Pix
    assert.equal(methodFromPayment("CREDIT_CARD", "pix"), "card");
    assert.equal(methodFromPayment(undefined, "card"), "card");
    assert.equal(methodFromPayment("OTHER", "pix"), "pix");
  });
});
