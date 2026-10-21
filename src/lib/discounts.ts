// Desconto por convite. Sem "server-only": regras puras, usadas no servidor, no painel e nos testes.

export type DiscountKind = "none" | "percent" | "fixed" | "courtesy";

// percent: value em % inteiro (1–100); fixed: value em centavos; none/courtesy: value 0
export type InviteDiscount = { kind: DiscountKind; value: number };

export const NO_DISCOUNT: InviteDiscount = { kind: "none", value: 0 };

export const isDiscountKind = (s: string): s is DiscountKind => s === "none" || s === "percent" || s === "fixed" || s === "courtesy";

export type PriceBreakdown = { listCents: number; discountCents: number; finalCents: number; courtesy: boolean };

// Valor final = preço do lote − desconto, nunca abaixo de zero. Se o resto ficar abaixo do mínimo do meio de
// pagamento (Stripe cobra no mínimo R$ 0,50), vira cortesia em vez de cobrar mais do que o calculado.
export function applyDiscount(listCents: number, discount: InviteDiscount, minChargeCents = 1): PriceBreakdown {
  let off = 0;
  if (discount.kind === "courtesy") off = listCents;
  else if (discount.kind === "percent") off = Math.round((listCents * Math.min(100, Math.max(0, discount.value))) / 100);
  else if (discount.kind === "fixed") off = Math.max(0, discount.value);
  off = Math.min(off, listCents);
  let finalCents = listCents - off;
  if (finalCents > 0 && finalCents < minChargeCents) {
    finalCents = 0;
    off = listCents;
  }
  return { listCents, discountCents: off, finalCents, courtesy: finalCents === 0 };
}

// "R$ 1.234,56" / "350" / "350,00" → centavos (sem limite; quem chama valida a faixa)
export function parseBRLCents(raw: string): number | null {
  const s = raw.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

// Campos do formulário do painel → desconto. null = valor inválido para o tipo escolhido.
export function parseDiscount(kind: string, raw: string): InviteDiscount | null {
  if (!isDiscountKind(kind) || kind === "none") return NO_DISCOUNT;
  if (kind === "courtesy") return { kind, value: 0 };
  if (kind === "percent") {
    const n = Number(raw.replace(/[%\s]/g, "").replace(",", "."));
    if (!Number.isInteger(n) || n < 1 || n > 100) return null;
    return n === 100 ? { kind: "courtesy", value: 0 } : { kind, value: n };
  }
  const cents = parseBRLCents(raw);
  if (cents === null || cents < 1 || cents > 2_500_000) return null;
  return { kind, value: cents };
}

const brl = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

// Rótulo curto pro painel e pra página do convite
export function describeDiscount(d: InviteDiscount): string {
  if (d.kind === "courtesy") return "Cortesia";
  if (d.kind === "percent") return `${d.value}% de desconto`;
  if (d.kind === "fixed") return `${brl(d.value)} de desconto`;
  return "Sem desconto";
}

// Valor do campo no formulário de edição
export function discountInputValue(d: InviteDiscount): string {
  if (d.kind === "percent") return String(d.value);
  if (d.kind === "fixed") return (d.value / 100).toFixed(2).replace(".", ",");
  return "";
}
