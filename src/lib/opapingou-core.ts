// Partes puras da integração com o Opa Pingou (sem "server-only" nem banco), cobertas por testes.
// Referência da API: docs/opapingou-api.md
import { createHmac, timingSafeEqual } from "node:crypto";

export const SIGNATURE_TOLERANCE_SECONDS = 300;

// Opa-Signature: t=<unix segundos>,v1=<hex HMAC-SHA256 de "<t>.<corpo bruto>">
export function verifyOpaSignature(rawBody: string, header: string | null, secret: string, nowMs = Date.now()): boolean {
  if (!header || !secret) return false;
  const parts: Record<string, string> = {};
  for (const pair of header.split(",")) {
    const i = pair.indexOf("=");
    if (i > 0) parts[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
  }
  const t = Number(parts.t);
  if (!Number.isFinite(t) || !parts.v1) return false;
  if (Math.abs(nowMs / 1000 - t) > SIGNATURE_TOLERANCE_SECONDS) return false;
  const expected = Buffer.from(signOpaPayload(rawBody, t, secret), "utf8");
  const received = Buffer.from(parts.v1.toLowerCase(), "utf8");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export const signOpaPayload = (rawBody: string, t: number, secret: string) =>
  createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");

// opk_live_<43> ou opk_test_<43>
export const isOpaApiKey = (key: string) => /^opk_(live|test)_[A-Za-z0-9_-]{43}$/.test(key);
export const isOpaTestKey = (key: string) => key.startsWith("opk_test_");
export const maskOpaKey = (key: string) => `${key.slice(0, 9)}…${key.slice(-4)}`;

export type ChargeStatus = "PENDING" | "PAID" | "EXPIRED" | "CANCELED";

export type ChargeKind = "PIX_QR" | "PAYMENT_LINK";

// Só os campos da cobrança que o site usa
export type OpaCharge = {
  id: string;
  amountCents: number;
  status: ChargeStatus;
  kind: ChargeKind;
  brCode: string | null;
  paymentLink: string | null; // checkout do link de pagamento (Abacate Pay: Pix e cartão à vista)
  paymentId: string | null; // pagamento que quitou a cobrança (GET /v1/payments/{id})
  expiresAt: string;
  paidAt: string | null;
};

// Só os campos do pagamento que o site usa
export type OpaPayment = {
  id: string;
  method: "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "BOLETO" | "ACCOUNT_MONEY" | "OTHER";
  charge: { id: string; kind: ChargeKind } | null;
};

// Meio de pagamento gravado na inscrição. Pelo kind da cobrança na criação; quando o pagamento pode ser consultado,
// vale o método dele (o link do Abacate também aceita Pix).
export type PaymentMethod = "pix" | "card";
export const paymentMethodLabel: Record<PaymentMethod, string> = { pix: "Pix", card: "Cartão de crédito" };
export const methodFromKind = (kind: ChargeKind): PaymentMethod => (kind === "PAYMENT_LINK" ? "card" : "pix");
export function methodFromPayment(method: OpaPayment["method"] | undefined, fallback: PaymentMethod): PaymentMethod {
  if (method === "PIX") return "pix";
  if (method === "CREDIT_CARD" || method === "DEBIT_CARD") return "card";
  return fallback;
}

// Descrição da cobrança: o Abacate Pay recusa acentos e travessões e corta em 100 caracteres. O Opa Pingou já
// normaliza na conta Abacate, mas mandamos pronta em todas as cobranças (Pix e cartão) para o texto ser o mesmo.
export const DESCRIPTION_MAX = 100;
export function chargeDescription(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‐-―−]/g, "-")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, DESCRIPTION_MAX)
    .trim();
}

export type OpaEvent = {
  id: string;
  type: string;
  occurredAt: string;
  testMode: boolean;
  data: { type: string; object: Record<string, unknown> };
};

export function parseOpaEvent(rawBody: string): OpaEvent | null {
  try {
    const e = JSON.parse(rawBody) as Partial<OpaEvent>;
    if (typeof e.id !== "string" || typeof e.type !== "string" || !e.data || typeof e.data.object !== "object" || !e.data.object) return null;
    return e as OpaEvent;
  } catch {
    return null;
  }
}

// Eventos de cobrança → status da inscrição
export const chargeEventStatus: Record<string, "paid" | "expired" | "canceled"> = {
  "charge.paid": "paid",
  "charge.expired": "expired",
  "charge.canceled": "canceled",
};

// Erro da API (application/problem+json): programe contra o code, nunca contra o texto
// (campos explícitos, sem parameter properties: os testes rodam com o type stripping do Node)
export class OpaApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly title: string;
  readonly requestId: string | null;
  readonly retryAfter: number | null;

  constructor(status: number, code: string, title: string, requestId: string | null, retryAfter: number | null) {
    super(`Opa Pingou ${status} ${code}: ${title}${requestId ? ` (requestId ${requestId})` : ""}`);
    this.name = "OpaApiError";
    this.status = status;
    this.code = code;
    this.title = title;
    this.requestId = requestId;
    this.retryAfter = retryAfter;
  }
}

// Endpoint de webhook como a API devolve (só os campos que o painel usa)
export type OpaWebhookEndpoint = { id: string; url: string; events: string[]; testMode: boolean; status: "ACTIVE" | "DISABLED"; lastDeliveredAt: string | null };

// Mesma URL de webhook: host sem diferença de caixa e sem a barra do fim
const normalizeUrl = (url: string) => {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host.toLowerCase()}${u.pathname.replace(/\/+$/, "")}${u.search}`;
  } catch {
    return url.trim().replace(/\/+$/, "");
  }
};
export const sameWebhookUrl = (a: string, b: string) => normalizeUrl(a) === normalizeUrl(b);

// Outros cadastros apontando para a URL deste site que não são o salvo no banco: o segredo deles não está aqui,
// então toda entrega recebe 400 de assinatura e o Opa Pingou desativa o endpoint depois de ~45h de tentativas.
export const duplicateWebhooks = <E extends Pick<OpaWebhookEndpoint, "id" | "url">>(endpoints: E[], url: string, savedId: string | null) =>
  endpoints.filter((e) => e.id !== savedId && sameWebhookUrl(e.url, url));

// "Cadastrar webhook" / "Trocar segredo": nunca cria um segundo endpoint para a mesma URL.
// - o salvo ainda existe para esta URL: troca o segredo dele (pedido explícito do botão);
// - não há salvo (ou ele sumiu), mas a conta já tem um endpoint para a URL: adota esse, preferindo o ativo,
//   trocando o segredo (o atual não está no banco);
// - nenhum: cria.
export type WebhookSetupPlan = { action: "rotate"; id: string; status: OpaWebhookEndpoint["status"] } | { action: "create" };

export function planWebhookSetup(endpoints: Pick<OpaWebhookEndpoint, "id" | "url" | "status">[], url: string, savedId: string | null): WebhookSetupPlan {
  const forUrl = endpoints.filter((e) => sameWebhookUrl(e.url, url));
  const target = forUrl.find((e) => e.id === savedId) ?? forUrl.find((e) => e.status === "ACTIVE") ?? forUrl[0];
  return target ? { action: "rotate", id: target.id, status: target.status } : { action: "create" };
}
