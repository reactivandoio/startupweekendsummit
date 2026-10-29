import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import sharp from "sharp";
import { CROP_SIZE, SOURCE_MAX } from "./photo-crop-core.ts";
import { processCroppedPhoto, processSourcePhoto } from "./photos.ts";

const fixture = (name: string) => readFile(new URL(`./fixtures/${name}`, import.meta.url));

describe("processCroppedPhoto", () => {
  it("vira WebP quadrado no tamanho do site, mesmo se o navegador mandou outro formato ou proporção", async () => {
    const out = await processCroppedPhoto(await fixture("jpg.jpg"));
    const meta = await sharp(out).metadata();
    assert.equal(meta.format, "webp");
    assert.equal(meta.width, CROP_SIZE);
    assert.equal(meta.height, CROP_SIZE);
  });
  it("PNG com transparência ganha fundo sólido (o card do site não tem xadrez)", async () => {
    const out = await processCroppedPhoto(await fixture("png-alpha.png"));
    const meta = await sharp(out).metadata();
    assert.equal(meta.format, "webp");
    assert.equal(meta.hasAlpha, false);
  });
  it("recusa o que não é imagem", async () => {
    await assert.rejects(processCroppedPhoto(Buffer.from("isso não é uma imagem")));
  });
});

describe("processSourcePhoto", () => {
  it("guarda o original em WebP sem ampliar", async () => {
    const out = await processSourcePhoto(await fixture("jpg.jpg"));
    const meta = await sharp(out).metadata();
    assert.equal(meta.format, "webp");
    assert.equal(meta.width, 300);
    assert.equal(meta.height, 120);
  });
  it("reduz imagens grandes ao lado máximo", async () => {
    const big = await sharp({ create: { width: 4000, height: 2000, channels: 3, background: "#39f" } }).jpeg().toBuffer();
    const meta = await sharp(await processSourcePhoto(big)).metadata();
    assert.equal(meta.width, SOURCE_MAX);
    assert.equal(meta.height, SOURCE_MAX / 2);
  });
  it("aplica a orientação EXIF (foto de celular deitada passa a ficar em pé de verdade)", async () => {
    // 200x100 marcada como "girar 90°" (orientation 6): depois de aplicar, 100x200 e sem a tag
    const exif = await sharp({ create: { width: 200, height: 100, channels: 3, background: "#f93" } })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const meta = await sharp(await processSourcePhoto(exif)).metadata();
    assert.equal(meta.width, 100);
    assert.equal(meta.height, 200);
    assert.equal(meta.orientation, undefined);
  });
});
