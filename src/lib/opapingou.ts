import "server-only";
import { chargeDescription, OpaApiError, type ChargeKind, type OpaCharge, type OpaPayment, type OpaWebhookEndpoint } from "@/lib/opapingou-core";
import { getSetting } from "@/lib/settings";
import { appUrl } from "@/lib/stripe";

// Cliente REST do Opa Pingou. Só as rotas da v1 listadas em docs/opapingou-api.md.
// A chave de API vem do painel (/admin/ingressos), não do .env; a URL base pode apontar pra staging.
export const opaApiUrl = () => (process.env.OPAPINGOU_API_URL ?? "https://api.opapingou.com.br").replace(/\/$/, "");

export const WEBHOOK_EVENTS = ["charge.paid", "charge.expired", "charge.canceled"] as const;

const TIMEOUT_MS = 15_000;

async function request<T>(method: string, path: string, opts: { key?: string; body?: unknown; idempotencyKey?: string } = {}): Promise<T> {
  const key = opts.key ?? (await getSetting("opapingou_api_key"));
  if (!key) throw new Error("Chave do Opa Pingou não configurada");
  const headers: Record<string, string> = { Authorization: `Bearer ${key}`, Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

  const res = await fetch(`${opaApiUrl()}/v1${path}`, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const p = (data ?? {}) as { code?: string; title?: string; requestId?: string };
    const retry = Number(res.headers.get("retry-after"));
    throw new OpaApiError(res.status, p.code ?? "UNKNOWN", p.title ?? res.statusText, p.requestId ?? res.headers.get("x-request-id"), Number.isFinite(retry) ? retry : null);
  }
  return data as T;
}

// Valida a chave sem efeito colateral. profile:read pode faltar na chave: 403 também prova que ela é válida.
export async function checkApiKey(key: string): Promise<{ ok: true; who: string | null } | { ok: false; code: string }> {
  try {
    const me = await request<{ email?: string; company?: { legalName?: string } | null }>("GET", "/me", { key });
    return { ok: true, who: me.company?.legalName ?? me.email ?? null };
  } catch (err) {
    if (err instanceof OpaApiError) return err.code === "INSUFFICIENT_SCOPE" ? { ok: true, who: null } : { ok: false, code: err.code };
    throw err;
  }
}

// Validade de 1h (mesma janela que segura a vaga). Idempotency-Key = id da inscrição (+ nº da tentativa, quando a
// pessoa retoma ou troca de meio e a inscrição ganha outra cobrança).
// Cartão: link de pagamento do Abacate Pay (à vista, sem repassar a tarifa: mesmo valor do Pix); bankAccountId
// fixa a conta Abacate, sem ele a API usa a conta padrão de links. O link não expira no Abacate: um pagamento
// depois do prazo ainda marca a cobrança como paga (ver applyChargeStatus).
export function createCharge(registrationId: string, amountCents: number, description: string, opts: { kind?: ChargeKind; bankAccountId?: string | null; attempt?: number } = {}) {
  const kind = opts.kind ?? "PIX_QR";
  return request<OpaCharge>("POST", "/charges", {
    idempotencyKey: opts.attempt ? `sws-${registrationId}-${opts.attempt + 1}` : `sws-${registrationId}`,
    body: {
      amountCents,
      description: chargeDescription(description),
      validity: "ONE_HOUR",
      kind,
      ...(kind === "PAYMENT_LINK" && opts.bankAccountId ? { bankAccountId: opts.bankAccountId } : {}),
    },
  });
}

export const getCharge = (id: string) => request<OpaCharge>("GET", `/charges/${encodeURIComponent(id)}`);

// Precisa do escopo payments:read; sem ele a API responde 403 e o meio fica pelo kind da cobrança
export const getPayment = (id: string) => request<OpaPayment>("GET", `/payments/${encodeURIComponent(id)}`);

export type { OpaWebhookEndpoint };

// URL que o site cadastra no Opa Pingou
export const opaWebhookUrl = () => `${appUrl()}/api/opapingou/webhook`;

// Todos os endpoints da conta no modo da chave, inclusive de outros sistemas. O guia mostra uma lista,
// mas a API devolve { items: [...] }: aceitamos os dois.
export async function listWebhookEndpoints(): Promise<OpaWebhookEndpoint[]> {
  const res = await request<OpaWebhookEndpoint[] | { items: OpaWebhookEndpoint[] }>("GET", "/webhook-endpoints");
  return Array.isArray(res) ? res : (res?.items ?? []);
}

export const createWebhookEndpoint = (url: string) =>
  request<OpaWebhookEndpoint & { secret: string }>("POST", "/webhook-endpoints", {
    body: { url, description: "Startup Weekend Summit — ingressos", events: [...WEBHOOK_EVENTS] },
  });

export const deleteWebhookEndpoint = (id: string) => request<void>("DELETE", `/webhook-endpoints/${encodeURIComponent(id)}`);

export const reactivateWebhookEndpoint = (id: string) =>
  request<OpaWebhookEndpoint>("PATCH", `/webhook-endpoints/${encodeURIComponent(id)}`, { body: { status: "ACTIVE" } });

export const rotateWebhookSecret = (id: string) =>
  request<OpaWebhookEndpoint & { secret: string }>("POST", `/webhook-endpoints/${encodeURIComponent(id)}/rotate-secret`);

export const testWebhookEndpoint = (id: string) => request<{ id: string; status: string }>("POST", `/webhook-endpoints/${encodeURIComponent(id)}/test`);
