import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clampCrop, CROP_SIZE, defaultCrop, nextRotation, parseCrop, rotatedSize, scaleFor, ZOOM_MAX, ZOOM_MIN } from "./photo-crop-core.ts";

describe("rotatedSize", () => {
  it("troca largura e altura a 90° e 270°", () => {
    assert.deepEqual(rotatedSize(400, 300, 0), { w: 400, h: 300 });
    assert.deepEqual(rotatedSize(400, 300, 90), { w: 300, h: 400 });
    assert.deepEqual(rotatedSize(400, 300, 180), { w: 400, h: 300 });
    assert.deepEqual(rotatedSize(400, 300, 270), { w: 300, h: 400 });
  });
});

describe("scaleFor", () => {
  it("com zoom 1 a imagem cobre o quadro exatamente pelo lado menor", () => {
    // 400x300 num quadro de 300: o lado menor (300) vira 300 → escala 1
    assert.equal(scaleFor(400, 300, { ...defaultCrop }, 300), 1);
    // quadro de 600: escala 2
    assert.equal(scaleFor(400, 300, { ...defaultCrop }, 600), 2);
  });
  it("girada a 90° o lado menor continua sendo o que cobre", () => {
    assert.equal(scaleFor(400, 300, { ...defaultCrop, rotation: 90 }, 300), 1);
  });
  it("zoom multiplica a escala", () => {
    assert.equal(scaleFor(400, 300, { ...defaultCrop, zoom: 2 }, 300), 2);
  });
});

describe("clampCrop", () => {
  it("imagem quadrada com zoom 1 não pode se mover", () => {
    const c = clampCrop({ x: 0.3, y: -0.2, zoom: 1, rotation: 0 }, 500, 500);
    assert.deepEqual(c, { x: 0, y: 0, zoom: 1, rotation: 0 });
  });
  it("paisagem com zoom 1 só anda no eixo x, até a borda da imagem", () => {
    // 400x300 cobre um quadro pelo lado 300: sobra 100px de largura = 50px pra cada lado = 1/6 do quadro
    const c = clampCrop({ x: 0.5, y: 0.5, zoom: 1, rotation: 0 }, 400, 300);
    assert.ok(Math.abs(c.x - 1 / 6) < 1e-9, `x=${c.x}`);
    assert.equal(c.y, 0);
    const neg = clampCrop({ x: -0.5, y: -0.5, zoom: 1, rotation: 0 }, 400, 300);
    assert.ok(Math.abs(neg.x + 1 / 6) < 1e-9);
  });
  it("girada a 90° a folga passa pro eixo y", () => {
    const c = clampCrop({ x: 0.5, y: 0.5, zoom: 1, rotation: 90 }, 400, 300);
    assert.equal(c.x, 0);
    assert.ok(Math.abs(c.y - 1 / 6) < 1e-9);
  });
  it("zoom 2 numa imagem quadrada deixa meio quadro de folga pra cada lado", () => {
    const c = clampCrop({ x: 9, y: -9, zoom: 2, rotation: 0 }, 500, 500);
    assert.deepEqual(c, { x: 0.5, y: -0.5, zoom: 2, rotation: 0 });
  });
  it("zoom fica entre o mínimo e o máximo", () => {
    assert.equal(clampCrop({ ...defaultCrop, zoom: 0.2 }, 500, 500).zoom, ZOOM_MIN);
    assert.equal(clampCrop({ ...defaultCrop, zoom: 99 }, 500, 500).zoom, ZOOM_MAX);
  });
});

describe("parseCrop", () => {
  it("aceita JSON válido e normaliza", () => {
    assert.deepEqual(parseCrop(JSON.stringify({ x: 0.1, y: -0.2, zoom: 1.5, rotation: 90 })), { x: 0.1, y: -0.2, zoom: 1.5, rotation: 90 });
    assert.deepEqual(parseCrop({ x: 0, y: 0, zoom: 1, rotation: 270 }), { x: 0, y: 0, zoom: 1, rotation: 270 });
  });
  it("recusa lixo", () => {
    assert.equal(parseCrop(""), null);
    assert.equal(parseCrop("não é json"), null);
    assert.equal(parseCrop(null), null);
    assert.equal(parseCrop({ x: "a", y: 0, zoom: 1, rotation: 0 }), null);
    assert.equal(parseCrop({ x: 0, y: 0, zoom: 1, rotation: 45 }), null);
    assert.equal(parseCrop({ x: Infinity, y: 0, zoom: 1, rotation: 0 }), null);
  });
  it("traz zoom e deslocamento pra dentro dos limites gerais", () => {
    const c = parseCrop({ x: 50, y: -50, zoom: 100, rotation: 180 });
    assert.ok(c);
    assert.equal(c.zoom, ZOOM_MAX);
    assert.ok(c.x <= 2 && c.y >= -2);
  });
});

describe("nextRotation", () => {
  it("gira em sentido horário e volta a 0", () => {
    assert.equal(nextRotation(0), 90);
    assert.equal(nextRotation(270), 0);
  });
});

describe("CROP_SIZE", () => {
  it("é quadrado o bastante para o maior card do site em telas 2x", () => {
    assert.ok(CROP_SIZE >= 640);
  });
});
