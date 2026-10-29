import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { hasTransparency } from "./image-alpha.ts";
import { processCroppedPhoto, processSourcePhoto } from "./photos.ts";

// Caminho absoluto, definido nos dois compose (volume nomeado "uploads", o mesmo para blue e green).
// Sem a variável, cai em ./uploads (gitignored) — mas aí o arquivo fica na camada do container e some no deploy.
const UPLOADS_DIR = process.env.UPLOADS_DIR ?? join(/*turbopackIgnore: true*/ process.cwd(), "uploads");
// turbopackIgnore: o caminho só existe em runtime; sem isso o build rastreia o projeto inteiro pro standalone
const pathOf = (filename: string) => join(/*turbopackIgnore: true*/ UPLOADS_DIR, filename);

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

const contentTypes = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", svg: "image/svg+xml" } as const;
// jpg continua servível (uploads antigos), mas não é mais aceito: não tem transparência e viraria um bloco preto no site
type Ext = keyof typeof contentTypes;

// Nome gerado por nós (uuid + extensão): qualquer outra coisa na URL é recusada, sem path traversal
const SAFE_NAME = /^[0-9a-f-]{36}\.(png|jpg|webp|svg)$/;

// O tipo vem dos bytes, não do mimetype nem da extensão que o navegador mandou
function sniff(buf: Buffer): Ext | null {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return "webp";
  // SVG exportado do Illustrator/Figma pode vir com BOM, declaração XML, comentários e DOCTYPE antes do <svg>
  const head = buf.subarray(0, 2048).toString("utf8").replace(/^﻿/, "");
  if (/^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(head)) return "svg";
  return null;
}

export const OPAQUE_MESSAGE = "Este arquivo tem fundo opaco e ficaria um bloco preto no site. Envie SVG, PNG ou WebP com fundo transparente.";

export type UploadResult = { ok: true; filename: string } | { ok: false; message: string };

// Logos de patrocinadores: SVG, PNG ou WebP com transparência, porque o site pinta o logo de tinta.
export async function saveImageUpload(file: File): Promise<UploadResult> {
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, message: "O logo passa de 2 MB. Exporte uma versão menor." };
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) return { ok: false, message: "Formato não aceito. Use SVG, PNG ou WebP com fundo transparente." };
  if (!hasTransparency(buf, ext)) return { ok: false, message: OPAQUE_MESSAGE };
  const filename = `${randomUUID()}.${ext}`;
  // um volume recém-criado monta vazio
  await mkdir(/*turbopackIgnore: true*/ UPLOADS_DIR, { recursive: true });
  await writeFile(pathOf(filename), buf);
  return { ok: true, filename };
}

/* Foto de organizador. "crop": o quadrado recortado no navegador, que o site exibe; "source": o original, guardado
   pra recortar de novo. Nos dois casos o arquivo salvo é o WebP que o sharp gera (tamanho e peso controlados aqui,
   não pelo navegador); o tipo recebido só precisa ser imagem rasterizada. */
export async function savePhotoUpload(file: File, role: "crop" | "source"): Promise<UploadResult> {
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, message: "A foto passa de 2 MB. Exporte uma versão menor." };
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (ext !== "jpg" && ext !== "png" && ext !== "webp") return { ok: false, message: "Formato não aceito. Use JPG, PNG ou WebP." };
  let out: Buffer;
  try {
    out = role === "crop" ? await processCroppedPhoto(buf) : await processSourcePhoto(buf);
  } catch (err) {
    console.error("[savePhotoUpload]", err);
    return { ok: false, message: "Não conseguimos ler essa imagem. Tente exportar de novo em JPG ou PNG." };
  }
  const filename = `${randomUUID()}.webp`;
  await mkdir(/*turbopackIgnore: true*/ UPLOADS_DIR, { recursive: true });
  await writeFile(pathOf(filename), out);
  return { ok: true, filename };
}

export async function readImageUpload(filename: string): Promise<{ body: Buffer; contentType: string } | null> {
  if (!SAFE_NAME.test(filename)) return null;
  try {
    const body = await readFile(pathOf(filename));
    return { body, contentType: contentTypes[filename.split(".").pop() as Ext] };
  } catch {
    return null;
  }
}

export async function deleteImageUpload(filename: string) {
  if (!SAFE_NAME.test(filename)) return;
  await unlink(pathOf(filename)).catch(() => {});
}

export const uploadUrl = (filename: string) => `/uploads/${filename}`;
