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

// Só os campos da cobrança que o site usa
export type OpaCharge = {
  id: string;
  amountCents: number;
  status: ChargeStatus;
  brCode: string | null;
  expiresAt: string;
  paidAt: string | null;
};

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
