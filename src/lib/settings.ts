import "server-only";
import { ensureSchema, sql } from "@/lib/db";

// Chaves conhecidas. Segredos (chave de API, segredo do webhook) nunca voltam para o navegador.
// site_theme: tema padrão do site ("dark" | "light"), escolhido em /admin/configuracoes.
export type SettingKey = "opapingou_api_key" | "opapingou_webhook_id" | "opapingou_webhook_secret" | "site_theme";

export async function getSetting(key: SettingKey): Promise<string | null> {
  await ensureSchema();
  const [row] = await sql<{ value: string }[]>`select value from settings where key = ${key}`;
  return row?.value ?? null;
}

export async function setSetting(key: SettingKey, value: string, userId: string | null) {
  await ensureSchema();
  await sql`
    insert into settings (key, value, updated_by) values (${key}, ${value}, ${userId})
    on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by`;
}

export async function deleteSetting(key: SettingKey) {
  await ensureSchema();
  await sql`delete from settings where key = ${key}`;
}
