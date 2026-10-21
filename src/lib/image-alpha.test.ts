// pnpm test — detecção de transparência nos bytes (logos viram preto no site; fundo opaco é recusado)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { hasTransparency } from "./image-alpha.ts";

const fx = (name: string) => new Uint8Array(readFileSync(new URL(`./fixtures/${name}`, import.meta.url)));

describe("hasTransparency", () => {
  it("PNG RGBA tem transparência", () => assert.equal(hasTransparency(fx("png-alpha.png"), "png"), true));
  it("PNG paleta com tRNS tem transparência", () => assert.equal(hasTransparency(fx("png-paleta-trns.png"), "png"), true));
  it("PNG RGB é opaco", () => assert.equal(hasTransparency(fx("png-opaco.png"), "png"), false));
  it("WebP lossless (VP8L) tem transparência", () => assert.equal(hasTransparency(fx("webp-alpha.webp"), "webp"), true));
  it("WebP lossy simples é opaco", () => assert.equal(hasTransparency(fx("webp-opaco.webp"), "webp"), false));
  it("JPG é sempre opaco", () => assert.equal(hasTransparency(fx("jpg.jpg"), "jpg"), false));
  it("SVG conta como transparente", () => assert.equal(hasTransparency(new Uint8Array(0), "svg"), true));
});
