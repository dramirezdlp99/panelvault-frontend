import { describe, expect, it } from "vitest";

import { detectFormat, ImportError, isImageName, mimeFor, naturalCompare, titleFromFileName } from "./detect";

describe("detectFormat", () => {
  it.each([
    [["a.cbz"], "CBZ"],
    [["a.ZIP"], "CBZ"],
    [["libro.pdf"], "PDF"],
    [["1.jpg", "2.png"], "IMAGES"],
    [["portada.webp"], "IMAGES"],
  ] as const)("%j → %s", (names, format) => {
    expect(detectFormat(names.map((name) => ({ name })))).toBe(format);
  });

  it("explica que CBR no se puede abrir en el navegador", () => {
    expect(() => detectFormat([{ name: "x.cbr" }])).toThrow(/CBR/);
  });

  it("rechaza formatos desconocidos y la selección vacía", () => {
    expect(() => detectFormat([{ name: "x.docx" }])).toThrow(ImportError);
    expect(() => detectFormat([{ name: "a.jpg" }, { name: "b.txt" }])).toThrow(ImportError);
    expect(() => detectFormat([])).toThrow(ImportError);
  });
});

describe("utilidades", () => {
  it("ordena con números naturales", () => {
    expect(["p10.png", "p2.png", "p1.png"].sort(naturalCompare)).toEqual(["p1.png", "p2.png", "p10.png"]);
  });

  it("reconoce imágenes y su tipo", () => {
    expect(isImageName("A.JPEG")).toBe(true);
    expect(isImageName("notas.txt")).toBe(false);
    expect(mimeFor("x.jpg")).toBe("image/jpeg");
    expect(mimeFor("x.webp")).toBe("image/webp");
  });

  it("arma un título legible", () => {
    expect(titleFromFileName("Little_Nemo__1905.cbz")).toBe("Little Nemo 1905");
    expect(titleFromFileName(".cbz")).toBe("Cómic sin título");
  });
});
