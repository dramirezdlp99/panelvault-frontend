// @vitest-environment node
import { zipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { ImportError } from "./detect";
import { extractCbz, isComicPage } from "./extract-cbz";

const bytes = (text: string) => new TextEncoder().encode(text);

describe("extractCbz", () => {
  it("extrae solo imágenes en orden natural e ignora basura del sistema", async () => {
    const zip = zipSync({
      "tomo/p10.jpg": bytes("10"),
      "tomo/p2.png": bytes("2"),
      "tomo/p1.webp": bytes("1"),
      "tomo/notas.txt": bytes("x"),
      "__MACOSX/tomo/._p1.webp": bytes("basura"),
      "tomo/.oculta.png": bytes("y"),
    });
    const pages = await extractCbz(zip);
    expect(await Promise.all(pages.map((p) => p.text()))).toEqual(["1", "2", "10"]);
    expect(pages.map((p) => p.type)).toEqual(["image/webp", "image/png", "image/jpeg"]);
  });

  it("falla con un mensaje claro si no hay imágenes o el ZIP está dañado", async () => {
    await expect(extractCbz(zipSync({ "a.txt": bytes("x") }))).rejects.toThrow("no contiene imágenes");
    await expect(extractCbz(bytes("no soy un zip"))).rejects.toBeInstanceOf(ImportError);
  });

  it("isComicPage", () => {
    expect(isComicPage("a/b/01.png")).toBe(true);
    expect(isComicPage("__MACOSX/01.png")).toBe(false);
    expect(isComicPage("a/.DS_Store")).toBe(false);
  });
});
