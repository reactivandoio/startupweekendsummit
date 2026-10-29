// Regras dos lotes (sem "server-only" nem banco): estado de cada lote, qual está à venda e as datas do painel.
//
// Um lote está à venda quando está ativo, dentro do período de vendas (início e fim opcionais) e com vaga
// (quantidade opcional). O primeiro nessas condições, pela posição, é o que vende; ao passar a data ou esgotar,
// entra o próximo.

export type LotState = "inactive" | "scheduled" | "on_sale" | "ended" | "sold_out";

export type LotRules = {
  active: boolean;
  quantity: number | null; // null = sem limite
  sold: number;
  startsAt: string | null; // ISO; null = desde já
  endsAt: string | null; // ISO; null = até esgotar
};

export const lotStateLabel: Record<LotState, string> = {
  inactive: "Inativo",
  scheduled: "Agendado",
  on_sale: "À venda",
  ended: "Encerrado por data",
  sold_out: "Esgotado",
};

export function lotState(l: LotRules, now = Date.now()): LotState {
  if (!l.active) return "inactive";
  if (l.endsAt && new Date(l.endsAt).getTime() <= now) return "ended";
  if (l.quantity !== null && l.sold >= l.quantity) return "sold_out";
  if (l.startsAt && new Date(l.startsAt).getTime() > now) return "scheduled";
  return "on_sale";
}

// Primeiro lote à venda (a lista já vem na ordem do painel). minCents: menor cobrança aceita pelo meio de pagamento.
export function lotOnSale<T extends LotRules & { priceCents: number }>(lots: T[], minCents = 1, now = Date.now()): T | null {
  return lots.find((l) => lotState(l, now) === "on_sale" && l.priceCents >= minCents) ?? null;
}

// Sem lote à venda: "sold_out" se algum ativo esgotou (por quantidade) e nenhum outro está agendado; senão "closed"
export function closedReason(lots: LotRules[], now = Date.now()): "closed" | "sold_out" {
  const states = lots.map((l) => lotState(l, now));
  return states.includes("sold_out") && !states.includes("scheduled") ? "sold_out" : "closed";
}

// Datas do painel em horário de Brasília (UTC−3, sem horário de verão desde 2019), no formato do <input type="datetime-local">
const BRT_OFFSET_MS = 3 * 60 * 60 * 1000;

// "2026-11-01T09:30" (Brasília) → ISO em UTC; vazio = null; inválido = undefined
export function parseBrasiliaInput(raw: string): string | null | undefined {
  const s = raw.trim();
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(s);
  if (!m) return undefined;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const utc = Date.UTC(y, mo - 1, d, h, mi) + BRT_OFFSET_MS;
  const check = new Date(utc - BRT_OFFSET_MS);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d || h > 23 || mi > 59) return undefined;
  return new Date(utc).toISOString();
}

// ISO → valor do <input type="datetime-local"> em Brasília
export function brasiliaInputValue(iso: string | null): string {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() - BRT_OFFSET_MS).toISOString().slice(0, 16);
}

const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

// "de 01/11/2026 09:30 até 30/11/2026 23:59" / "a partir de …" / "até …" / ""
export function describePeriod(startsAt: string | null, endsAt: string | null): string {
  if (startsAt && endsAt) return `de ${fmt.format(new Date(startsAt))} até ${fmt.format(new Date(endsAt))}`;
  if (startsAt) return `a partir de ${fmt.format(new Date(startsAt))}`;
  if (endsAt) return `até ${fmt.format(new Date(endsAt))}`;
  return "";
}
