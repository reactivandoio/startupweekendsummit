// Exclusão lógica nos cadastros do painel (STA-26): nada sai do banco, o removido fica com quem e quando.

export type Removal = {
  removedAt: string | null; // null = na lista
  removedByName: string; // quem removeu (nome ou e-mail); "" se a conta foi apagada
};

export type RemovalRow = { removed_at: Date | null; removed_by_name?: string | null };

export const toRemoval = (r: RemovalRow): Removal => ({
  removedAt: r.removed_at ? r.removed_at.toISOString() : null,
  removedByName: r.removed_by_name ?? "",
});

// Aba "Removidos" de cada tela: ?removidos=1
export const REMOVED_PARAM = "removidos";
export const showingRemoved = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) === "1";

const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

export function removalLabel(r: Removal): string {
  if (!r.removedAt) return "";
  return `Removido em ${fmt.format(new Date(r.removedAt))}${r.removedByName ? ` por ${r.removedByName}` : ""}`;
}
