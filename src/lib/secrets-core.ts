import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Criptografia em repouso dos segredos guardados em settings (chave da API e segredo do webhook do Opa Pingou).
// AES-256-GCM com a chave de SETTINGS_ENCRYPTION_KEY (32 bytes em base64), nunca no repositório nem no banco.
// Formato gravado: enc:v1:<iv>:<tag>:<cifrado>, tudo em base64url. O nome da configuração entra como AAD, então um
// valor copiado para outra linha não abre. Sem o prefixo, o valor é texto puro (anterior ao STA-23).

const PREFIX = "enc:v1:";

export type EncryptionKeyState = { state: "ok"; key: Buffer } | { state: "missing" | "invalid"; key: null };

// Lê a chave sem nunca devolver o texto dela; tamanho errado conta como inválida (e o site segue sem cifrar).
export function parseEncryptionKey(raw: string | undefined): EncryptionKeyState {
  const trimmed = raw?.trim();
  if (!trimmed) return { state: "missing", key: null };
  const key = Buffer.from(trimmed, "base64");
  return key.length === 32 ? { state: "ok", key } : { state: "invalid", key: null };
}

export const isEncrypted = (value: string) => value.startsWith(PREFIX);

export function encryptSecret(plain: string, key: Buffer, name: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(name));
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return PREFIX + [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(":");
}

// Texto puro volta como está; cifrado sem a chave, com a chave errada ou adulterado volta null.
export function decryptSecret(stored: string, key: Buffer | null, name: string): string | null {
  if (!isEncrypted(stored)) return stored;
  if (!key) return null;
  const parts = stored.slice(PREFIX.length).split(":");
  if (parts.length !== 3) return null;
  try {
    const [iv, tag, data] = parts.map((p) => Buffer.from(p, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAAD(Buffer.from(name));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

// Valor a gravar: cifrado quando há chave; sem ela, texto puro como antes (as vendas não param por falta da variável).
export const sealSecret = (plain: string, key: Buffer | null, name: string) => (key ? encryptSecret(plain, key, name) : plain);

// Migração: o novo valor de uma linha em texto puro, ou null quando não há o que fazer (já cifrada ou sem chave).
export const migratedSecret = (stored: string, key: Buffer | null, name: string) =>
  key && !isEncrypted(stored) ? encryptSecret(stored, key, name) : null;

// Para o painel: só as pontas, nunca o meio. Curto demais não mostra nada.
export const maskSecret = (value: string, head = 4, tail = 4) => (value.length <= head + tail + 4 ? "••••" : `${value.slice(0, head)}…${value.slice(-tail)}`);
