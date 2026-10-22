import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_THEME, otherTheme, parseTheme, themeColor } from "./theme-core.ts";

describe("parseTheme", () => {
  it("aceita só dark e light", () => {
    assert.equal(parseTheme("dark"), "dark");
    assert.equal(parseTheme("light"), "light");
    assert.equal(parseTheme("auto"), null);
    assert.equal(parseTheme(""), null);
    assert.equal(parseTheme(undefined), null);
    assert.equal(parseTheme(null), null);
  });
});

describe("tema padrão", () => {
  it("começa escuro e tem cor de barra para os dois temas", () => {
    assert.equal(DEFAULT_THEME, "dark");
    assert.equal(otherTheme("dark"), "light");
    assert.equal(otherTheme("light"), "dark");
    assert.match(themeColor.dark, /^#[0-9a-f]{6}$/);
    assert.match(themeColor.light, /^#[0-9a-f]{6}$/);
  });
});
