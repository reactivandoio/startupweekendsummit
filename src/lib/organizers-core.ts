// Regras dos organizadores sem banco nem servidor: usadas pelo painel (cliente e Server Action), pelo site e pelos testes.

export const NAME_MAX = 120;
export const ROLE_MAX = 120;
export const BIO_MAX = 280;
export const ALT_MAX = 200;
export const URL_MAX = 500;
export const SOCIALS_MAX = 8;

export const socialKinds = [
  { id: "linkedin", label: "LinkedIn", hosts: ["linkedin.com"] },
  { id: "instagram", label: "Instagram", hosts: ["instagram.com"] },
  { id: "x", label: "X (Twitter)", hosts: ["x.com", "twitter.com"] },
  { id: "site", label: "Site", hosts: [] },
  { id: "outra", label: "Outra", hosts: [] },
] as const;

export type SocialKind = (typeof socialKinds)[number]["id"];
export type Social = { kind: SocialKind; url: string };

export const isSocialKind = (k: string): k is SocialKind => socialKinds.some((s) => s.id === k);
export const socialLabel = (k: SocialKind) => socialKinds.find((s) => s.id === k)?.label ?? "Link";
// Nome lido no aria-label do ícone ("LinkedIn de Maria"); "Outra" não diz nada, vira "Link"
export const socialName = (k: SocialKind) => (k === "outra" ? "Link" : k === "x" ? "X" : socialLabel(k));

// "empresa.com.br" vira "https://empresa.com.br"; só http(s) passa. Vazio continua vazio; inválido é null.
export function normalizeUrl(raw: string): string | null {
  if (!raw) return "";
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    // "https://fulano" passa no URL(), mas não é endereço de verdade
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

const hostMatches = (hostname: string, hosts: readonly string[]) =>
  hosts.some((h) => hostname === h || hostname.endsWith(`.${h}`));

/* Um link de rede: "@fulano" no Instagram e no X vira o perfil; nas redes conhecidas o domínio precisa ser o da rede
   (evita LinkedIn apontando pro Instagram). Devolve a URL normalizada ou a mensagem de erro. */
export function parseSocial(kind: SocialKind, raw: string): { ok: true; url: string } | { ok: false; message: string } {
  const value = raw.trim().slice(0, URL_MAX);
  const label = socialLabel(kind);
  const handle = /^@([A-Za-z0-9._]{1,30})$/.exec(value);
  if (handle && (kind === "instagram" || kind === "x")) {
    return { ok: true, url: `https://${kind === "x" ? "x.com" : "instagram.com"}/${handle[1]}` };
  }
  const url = normalizeUrl(value);
  if (!url) return { ok: false, message: `Link do ${label} inválido. Use o endereço completo, ex.: https://…` };
  const { hosts } = socialKinds.find((s) => s.id === kind)!;
  if (hosts.length > 0 && !hostMatches(new URL(url).hostname, hosts)) {
    return { ok: false, message: `O link do ${label} precisa ser de ${hosts.join(" ou ")}.` };
  }
  return { ok: true, url };
}

/* Lista do formulário (tipos e URLs em pares, na ordem da tela). Linha sem URL é ignorada (o "adicionar" que ficou
   vazio); qualquer outra inválida derruba o envio com a mensagem da primeira. */
export function parseSocials(kinds: string[], urls: string[]): { ok: true; socials: Social[] } | { ok: false; message: string } {
  const socials: Social[] = [];
  for (const [i, rawUrl] of urls.entries()) {
    if (!rawUrl.trim()) continue;
    const kind = kinds[i] ?? "";
    if (!isSocialKind(kind)) return { ok: false, message: "Escolha o tipo de cada rede social." };
    const parsed = parseSocial(kind, rawUrl);
    if (!parsed.ok) return parsed;
    socials.push({ kind, url: parsed.url });
  }
  if (socials.length > SOCIALS_MAX) return { ok: false, message: `No máximo ${SOCIALS_MAX} redes por organizador.` };
  return { ok: true, socials };
}

// Lido do banco (jsonb): descarta o que não tiver a forma esperada em vez de quebrar a página
export function sanitizeSocials(value: unknown): Social[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (s): s is Social => !!s && typeof s === "object" && isSocialKind(String(s.kind)) && typeof s.url === "string" && /^https?:\/\//.test(s.url),
  );
}

// Sem foto, o card mostra as iniciais: primeira e última palavra do nome
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}
