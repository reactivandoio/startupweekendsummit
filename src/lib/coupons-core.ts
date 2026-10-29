// Regras dos cupons (sem "server-only" nem banco), cobertas por testes.
//
// Cupom = código de divulgação de uma track: com desconto (% ou valor fixo; 100% = gratuito) ou sem (só rastreia a
// origem). Vale em alguns lotes ou em todos, com limite de usos e período opcionais. Não acumula com o desconto do
// convite: vale o maior (bestDiscount em discounts.ts).

import { describeDiscount, type DiscountSource, type InviteDiscount, type PriceBreakdown } from "./discounts.ts";

// Preço mostrado no checkout e cobrado no envio (serializável: vai do servidor para o formulário)
export type PriceQuote = PriceBreakdown & { source: DiscountSource | null; couponCode: string | null; note: string };

const describe = (d: InviteDiscount) => (d.kind === "courtesy" ? "100% de desconto, ingresso gratuito" : describeDiscount(d)); // "10% de desconto" / "R$ 50,00 de desconto"

// Linha explicando o desconto aplicado (ou por que o cupom não mudou o valor)
export function quoteNote(q: { source: DiscountSource | null; discountCents: number }, invite: InviteDiscount, coupon: { code: string; discount: InviteDiscount } | null): string {
  if (q.source === "coupon" && coupon) return `Cupom ${coupon.code}: ${describe(coupon.discount)}`;
  if (q.source === "invite") {
    const base = invite.kind === "courtesy" ? "Cortesia do convite" : `Desconto do convite: ${describe(invite)}`;
    return coupon ? `${base}. É maior que o do cupom ${coupon.code}, que fica registrado (os descontos não se somam).` : base;
  }
  return coupon ? `Cupom ${coupon.code} aplicado.` : "";
}

export type CouponRules = {
  active: boolean;
  discount: InviteDiscount; // kind "none": só rastreamento
  lotIds: string[]; // vazio = todos os lotes
  maxUses: number | null; // null = sem limite
  uses: number; // pagas + pagamentos abertos (mesma regra de vaga dos lotes), sem as reprovadas
  startsAt: string | null;
  endsAt: string | null;
};

export type CouponProblem = "not_found" | "inactive" | "not_started" | "expired" | "exhausted" | "wrong_lot";

// Código: sem diferenciar maiúsculas (guardado e comparado em maiúsculas), letras, números, "-" e "_"
export const normalizeCouponCode = (raw: string) => raw.trim().toUpperCase().replace(/\s+/g, "");
export const isValidCouponCode = (code: string) => /^[A-Z0-9_-]{3,40}$/.test(code);

// lotId: lote à venda agora (null = sem lotes, valor único do .env)
export function couponProblem(c: CouponRules | null, lotId: string | null, now = Date.now()): CouponProblem | null {
  if (!c) return "not_found";
  if (!c.active) return "inactive";
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return "not_started";
  if (c.endsAt && new Date(c.endsAt).getTime() <= now) return "expired";
  if (c.maxUses !== null && c.uses >= c.maxUses) return "exhausted";
  if (c.lotIds.length > 0 && (!lotId || !c.lotIds.includes(lotId))) return "wrong_lot";
  return null;
}

export function couponProblemMessage(problem: CouponProblem, code: string): string {
  const c = code || "informado";
  switch (problem) {
    case "not_found":
      return `O cupom ${c} não existe. Confira como foi escrito.`;
    case "inactive":
      return `O cupom ${c} não está mais disponível.`;
    case "not_started":
      return `O cupom ${c} ainda não está valendo.`;
    case "expired":
      return `O cupom ${c} expirou.`;
    case "exhausted":
      return `O cupom ${c} esgotou: todos os usos já foram feitos.`;
    case "wrong_lot":
      return `O cupom ${c} não vale para o lote à venda agora.`;
  }
}

// Origem da inscrição para o painel e o CSV: convite, inscrição aberta ou link de cupom (/inscricao/aberta?cupom=…)
export type RegistrationEntry = "invite" | "open" | "coupon_link";
export const entryLabel: Record<RegistrationEntry, string> = { invite: "Convite", open: "Inscrição aberta", coupon_link: "Link de cupom" };
export const entryFilters = ["invite", "open", "coupon_link"] as const satisfies readonly RegistrationEntry[];
export const parseEntry = (v: unknown): RegistrationEntry | null => ((entryFilters as readonly unknown[]).includes(v) ? (v as RegistrationEntry) : null);
export function registrationEntry(r: { source: "invite" | "open"; couponViaLink: boolean }): RegistrationEntry {
  if (r.source === "invite") return "invite";
  return r.couponViaLink ? "coupon_link" : "open";
}
