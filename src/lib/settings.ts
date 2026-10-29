import "server-only";
import { ensureSchema, sql } from "@/lib/db";
import { decryptSecret, isEncrypted, migratedSecret, parseEncryptionKey, sealSecret, type EncryptionKeyState } from "@/lib/secrets-core";

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

// Cifrados em repouso com SETTINGS_ENCRYPTION_KEY (ver secrets-core). Sem a variável seguem em texto puro, como antes.
const SECRET_KEYS: readonly SettingKey[] = ["opapingou_api_key", "opapingou_webhook_secret"];
const isSecret = (key: SettingKey) => SECRET_KEYS.includes(key);
const encryptionKey = () => parseEncryptionKey(process.env.SETTINGS_ENCRYPTION_KEY);

// A migração espera o processo estar no ar há 10 min. No blue/green a cor nova já recebe o healthcheck enquanto a
// antiga (sem este código) atende o tráfego; se a nova cifrasse logo, a antiga passaria a mandar o valor cifrado
// como chave da API e as cobranças falhariam até a troca do nginx. Ler valores cifrados funciona desde o início.
const MIGRATE_AFTER_S = 600;
const migrationReady = () => process.uptime() > MIGRATE_AFTER_S;

// Logs só com o nome da configuração: nunca o valor, nem o erro do driver (que pode trazer os parâmetros da query).
async function migrate(key: SettingKey, stored: string, encKey: Buffer | null) {
  if (!migrationReady()) return;
  const next = migratedSecret(stored, encKey, key);
  if (!next) return;
  // "and value = stored": se outra requisição já migrou ou o painel trocou o valor, não sobrescreve
  await sql`update settings set value = ${next} where key = ${key} and value = ${stored}`.catch(() =>
    console.error(`[settings] não consegui cifrar ${key} agora; segue em texto puro e tento de novo na próxima leitura`),
  );
}

export async function getSetting(key: SettingKey): Promise<string | null> {
  await ensureSchema();
  const [row] = await sql<{ value: string }[]>`select value from settings where key = ${key}`;
  if (!row || !isSecret(key)) return row?.value ?? null;
  const { key: encKey } = encryptionKey();
  const plain = decryptSecret(row.value, encKey, key);
  if (plain === null) {
    console.error(`[settings] ${key} está cifrado e não abre: SETTINGS_ENCRYPTION_KEY ausente ou diferente da usada para cifrar`);
    return null;
  }
  await migrate(key, row.value, encKey);
  return plain;
}

// plaintext: ainda em texto puro (sem chave, ou com chave mas antes da janela da migração)
export type SecretsStatus = { key: EncryptionKeyState["state"]; plaintext: SettingKey[]; unreadable: SettingKey[] };

// Estado para o alerta do painel; de quebra migra o que ainda estiver em texto puro (idempotente).
export async function secretsStatus(): Promise<SecretsStatus> {
  await ensureSchema();
  const { state, key: encKey } = encryptionKey();
  const rows = await sql<{ key: SettingKey; value: string }[]>`select key, value from settings where key in ${sql(SECRET_KEYS)}`;
  const status: SecretsStatus = { key: state, plaintext: [], unreadable: [] };
  for (const row of rows) {
    if (isEncrypted(row.value)) {
      if (decryptSecret(row.value, encKey, row.key) === null) status.unreadable.push(row.key);
    } else if (encKey && migrationReady()) await migrate(row.key, row.value, encKey);
    else status.plaintext.push(row.key);
  }
  return status;
}

export const openRegistrationEnabled = async () => (await getSetting("open_registration")) === "on";
export const cardPaymentEnabled = async () => (await getSetting("opapingou_card")) !== "off";

export async function setSetting(key: SettingKey, value: string, userId: string | null) {
  await ensureSchema();
  const stored = isSecret(key) ? sealSecret(value, encryptionKey().key, key) : value;
  await sql`
    insert into settings (key, value, updated_by) values (${key}, ${stored}, ${userId})
    on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by`;
}

export async function deleteSetting(key: SettingKey) {
  await ensureSchema();
  await sql`delete from settings where key = ${key}`;
}
