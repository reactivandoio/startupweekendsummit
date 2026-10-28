import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MARQUEE_SPEED, marqueeLayout } from "./marquee-core.ts";

describe("marqueeLayout", () => {
  it("duas cópias bastam quando uma cópia já cobre a janela", () => {
    assert.deepEqual(marqueeLayout(1600, 1440), { copies: 2, duration: 1600 / MARQUEE_SPEED });
  });

  it("repete a cópia até que as cópias extras cubram a janela (sem buraco no fim do loop)", () => {
    // 390px de janela, cópia de 300px: 1 cópia deslizando + 2 cobrindo a janela = 3
    const { copies } = marqueeLayout(300, 390);
    assert.equal(copies, 3);
    assert.ok((copies - 1) * 300 >= 390);
    // cópia bem estreita (um logo só) numa tela larga
    const wide = marqueeLayout(120, 1440);
    assert.ok((wide.copies - 1) * 120 >= 1440);
    assert.equal(wide.copies, 13);
  });

  it("a duração acompanha a largura (velocidade constante em px/s)", () => {
    assert.equal((marqueeLayout(1000, 400).duration ?? 0) * 2, marqueeLayout(2000, 400).duration);
    assert.equal(marqueeLayout(1000, 400, 100).duration, 10);
  });

  it("sem medida (0 ou NaN) cai no padrão de duas cópias e deixa a duração a cargo do CSS", () => {
    assert.deepEqual(marqueeLayout(0, 1440), { copies: 2, duration: null });
    assert.deepEqual(marqueeLayout(Number.NaN, 1440), { copies: 2, duration: null });
  });
});
