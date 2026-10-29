// pnpm test — exclusão lógica nos cadastros do painel (STA-26)
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { removalLabel, showingRemoved, toRemoval } from "./removal-core.ts";

describe("toRemoval", () => {
  it("na lista: sem data nem autor", () => {
    assert.deepEqual(toRemoval({ removed_at: null }), { removedAt: null, removedByName: "" });
  });
  it("removido: data em ISO e quem removeu", () => {
    const r = toRemoval({ removed_at: new Date("2026-10-29T15:30:00Z"), removed_by_name: "Pedro" });
    assert.deepEqual(r, { removedAt: "2026-10-29T15:30:00.000Z", removedByName: "Pedro" });
  });
  it("conta de quem removeu apagada: nome vazio", () => {
    assert.equal(toRemoval({ removed_at: new Date(), removed_by_name: null }).removedByName, "");
  });
});

describe("removalLabel", () => {
  it("data no horário de Brasília e quem removeu", () => {
    assert.equal(removalLabel({ removedAt: "2026-10-29T15:30:00Z", removedByName: "Pedro" }), "Removido em 29/10/2026, 12:30 por Pedro");
  });
  it("sem autor", () => {
    assert.equal(removalLabel({ removedAt: "2026-10-29T15:30:00Z", removedByName: "" }), "Removido em 29/10/2026, 12:30");
  });
  it("na lista: vazio", () => {
    assert.equal(removalLabel({ removedAt: null, removedByName: "" }), "");
  });
});

describe("showingRemoved", () => {
  it("só ?removidos=1 abre a aba", () => {
    assert.equal(showingRemoved("1"), true);
    assert.equal(showingRemoved(["1", "0"]), true);
    assert.equal(showingRemoved(undefined), false);
    assert.equal(showingRemoved("0"), false);
    assert.equal(showingRemoved("sim"), false);
  });
});

// Regra do projeto: exclusão no painel é sempre lógica. Nenhum cadastro sai do banco; a listagem normal esconde os
// removidos, a aba Removidos os mostra e o Restaurar os traz de volta.
const src = (file: string) => readFileSync(new URL(`./${file}`, import.meta.url), "utf8");
const cadastros = [
  { file: "organizers.ts", table: "organizers", list: "listOrganizers", removed: "listRemovedOrganizers", remove: "removeOrganizer", restore: "restoreOrganizer" },
  { file: "sponsors.ts", table: "sponsors", list: "listSponsors", removed: "listRemovedSponsors", remove: "removeSponsor", restore: "restoreSponsor" },
  { file: "invites.ts", table: "invites", list: "listInvites", removed: "listRemovedInvites", remove: "removeInvite", restore: "restoreInvite" },
  { file: "coupons.ts", table: "coupons", list: "listCoupons", removed: "listRemovedCoupons", remove: "removeCoupon", restore: "restoreCoupon" },
  { file: "tickets.ts", table: "ticket_lots", list: "listLots", removed: "listRemovedLots", remove: "removeLot", restore: "restoreLot" },
  { file: "volunteers.ts", table: "volunteers", list: "listVolunteers", removed: "listRemovedVolunteers", remove: "removeVolunteer", restore: "restoreVolunteer" },
  { file: "auth.ts", table: "users", list: "listUsers", removed: "listRemovedUsers", remove: "removeUser", restore: "restoreUser" },
];

// Corpo da função exportada `name` (até a próxima declaração no nível do módulo)
function body(code: string, name: string): string {
  const start = code.search(new RegExp(`export async function ${name}\\(`));
  assert.notEqual(start, -1, `${name} não encontrada`);
  const rest = code.slice(start + 1);
  const end = rest.search(/\n(export |const |function |type |\/\/ )/);
  return end === -1 ? rest : rest.slice(0, end);
}

describe("cadastros do painel: exclusão lógica", () => {
  for (const c of cadastros) {
    describe(c.table, () => {
      const code = src(c.file);
      it("nada é apagado do banco", () => {
        assert.doesNotMatch(code, new RegExp(`delete\\s+from\\s+${c.table}\\b`, "i"));
      });
      it("remover marca removed_at e removed_by", () => {
        const fn = body(code, c.remove);
        assert.match(fn, new RegExp(`update\\s+${c.table}\\b`));
        assert.match(fn, /removed_at = now\(\), removed_by = \$\{/);
      });
      it("a lista esconde os removidos", () => {
        assert.match(body(code, c.list), /removed_at is null/);
      });
      it("a aba Removidos lista só os removidos, com quem removeu", () => {
        const fn = body(code, c.removed);
        assert.match(fn, /removed_at is not null/);
        assert.match(fn, /removedByName\(|select\(\)/);
      });
      it("restaurar limpa as duas colunas", () => {
        assert.match(body(code, c.restore), /removed_at = null, removed_by = null[\s\S]*removed_at is not null/);
      });
    });
  }

  it("o schema cria as colunas em todos os cadastros", () => {
    const db = src("db.ts");
    for (const c of cadastros) assert.match(db, new RegExp(`"${c.table}"`));
    assert.match(db, /add column if not exists removed_at timestamptz/);
    assert.match(db, /add column if not exists removed_by uuid references users\(id\) on delete set null/);
  });

  it("remover não apaga arquivos enviados (fotos e logos)", () => {
    const actions = readFileSync(new URL("../app/admin/actions.ts", import.meta.url), "utf8");
    for (const name of ["removeOrganizer", "removeSponsor"]) assert.doesNotMatch(body(actions, name), /deleteImageUpload/);
  });

  it("checkout, site e login ignoram os removidos", () => {
    assert.match(body(src("coupons.ts"), "getCouponByCode"), /removed_at is null/);
    assert.match(body(src("invites.ts"), "getInviteByCode"), /removed_at is null/);
    assert.match(body(src("auth.ts"), "requestLoginLink"), /removed_at is null/);
    assert.match(body(src("auth.ts"), "consumeLoginToken"), /removed_at is null/);
    assert.match(body(src("auth.ts"), "getCurrentUser"), /removed_at is null/);
  });
});
