import "server-only";
import { ensureSchema, sql } from "@/lib/db";

// Chaves conhecidas. Segredos (chave de API, segredo do webhook) nunca voltam para o navegador.
// site_theme: tema padrão do site ("dark" | "light"), escolhido em /admin/configuracoes.
// open_registration: "on" abre /inscricao/aberta (cadastro sem convite, com aprovação); sem a chave, fica fechada.
// opapingou_card: "off" esconde o cartão de crédito no checkout; sem a chave, o cartão aparece ao lado do Pix.
// opapingou_card_account: bankAccountId da conta Abacate Pay no Opa Pingou para os links de pagamento (opcional).
export type SettingKey =
  | "opapingou_api_key"
  | "opapingou_webhook_id"
  | "opapingou_webhook_secret"
  | "opapingou_card"
  | "opapingou_card_account"
  | "site_theme"
  | "open_registration";

export async function getSetting(key: SettingKey): Promise<string | null> {
  await ensureSchema();
  const [row] = await sql<{ value: string }[]>`select value from settings where key = ${key}`;
  return row?.value ?? null;
}

export const openRegistrationEnabled = async () => (await getSetting("open_registration")) === "on";
export const cardPaymentEnabled = async () => (await getSetting("opapingou_card")) !== "off";

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
