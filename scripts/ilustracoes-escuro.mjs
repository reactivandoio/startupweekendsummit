// Gera a versão para fundo escuro de cada ilustração em public/ilustracoes (<nome>-escuro.webp).
//
// As ilustrações do pacote da marca são opacas, em três cores: papel branco, tinta preta e Marigold.
// Cada pixel é tratado como mistura das três (v = m·Marigold + w·branco + k·preto, m + w + k = 1),
// resolvida por mínimos quadrados. No escuro, o papel vira transparente, a tinta vira branca e o
// Marigold fica como está — assim a mesma arte funciona sobre qualquer fundo escuro.
//
// Uso: node scripts/ilustracoes-escuro.mjs   (pnpm ilustracoes). Roda de novo quando entrar arte nova.
import { createRequire } from "node:module";
import { readdirSync } from "node:fs";
import path from "node:path";

// sharp vem com o Next (dependência opcional), não é dependência direta do projeto
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");

const dir = path.resolve("public/ilustracoes");
const M = [234, 181, 61]; // Marigold #eab53d
const W = [255, 255, 255];

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
// Equações normais de [M W]·[m w]ᵀ ≈ v, resolvidas uma vez
const mm = dot(M, M), mw = dot(M, W), ww = dot(W, W);
const det = mm * ww - mw * mw;

function toDark(data) {
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const v = [data[i], data[i + 1], data[i + 2]];
    const mv = dot(M, v), wv = dot(W, v);
    let m = clamp((ww * mv - mw * wv) / det, 0, 1);
    const w = clamp((mm * wv - mw * mv) / det, 0, 1 - m);
    const k = 1 - m - w;
    // ruído de quantização vira 0 ou 1 cravado: arte mais limpa e arquivo menor
    const alpha = m + k < 0.03 ? 0 : m + k > 0.97 ? 1 : m + k;
    if (alpha > 0) {
      out[i] = Math.round((m * M[0] + k * 255) / alpha);
      out[i + 1] = Math.round((m * M[1] + k * 255) / alpha);
      out[i + 2] = Math.round((m * M[2] + k * 255) / alpha);
    }
    out[i + 3] = Math.round(alpha * 255);
  }
  return out;
}

for (const file of readdirSync(dir)) {
  if (!file.endsWith(".webp") || file.endsWith("-escuro.webp")) continue;
  const { data, info } = await sharp(path.join(dir, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const target = path.join(dir, file.replace(/\.webp$/, "-escuro.webp"));
  await sharp(toDark(data), { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 85, alphaQuality: 100 })
    .toFile(target);
  console.log(`${file} → ${path.basename(target)}`);
}
