import { describe, expect, it } from "vitest";

import { initialReaderState, keyToAction, readerReducer, resolvedPanel, type ReaderState } from "./reader-state";

const guided = (overrides: Partial<ReaderState> = {}): ReaderState => ({
  ...initialReaderState(3, 1, 0, "guided"),
  panelCounts: { 1: 3, 2: 2, 3: 4 },
  ...overrides,
});

describe("initialReaderState", () => {
  it("acota la página al rango del cómic", () => {
    expect(initialReaderState(10, 99).page).toBe(10);
    expect(initialReaderState(10, 0).page).toBe(1);
    expect(initialReaderState(10, Number.NaN).page).toBe(1);
  });
});

describe("modo página completa", () => {
  it("avanza y retrocede de página sin salirse", () => {
    let state = initialReaderState(2);
    state = readerReducer(state, { type: "prev" });
    expect(state.page).toBe(1);
    state = readerReducer(state, { type: "next" });
    state = readerReducer(state, { type: "next" });
    expect(state.page).toBe(2);
  });

  it("salta a una página concreta", () => {
    expect(readerReducer(initialReaderState(10), { type: "goToPage", page: 7 }).page).toBe(7);
    expect(readerReducer(initialReaderState(10), { type: "goToPage", page: 70 }).page).toBe(10);
  });
});

describe("modo viñeta por viñeta", () => {
  it("recorre las viñetas y pasa a la primera de la página siguiente", () => {
    let state = guided();
    state = readerReducer(state, { type: "next" });
    state = readerReducer(state, { type: "next" });
    expect(resolvedPanel(state)).toBe(2);
    state = readerReducer(state, { type: "next" });
    expect(state).toMatchObject({ page: 2, panel: 0 });
  });

  it("al retroceder desde la primera viñeta va a la última de la página anterior", () => {
    const state = readerReducer(guided({ page: 2, panel: 0 }), { type: "prev" });
    expect(state.page).toBe(1);
    expect(resolvedPanel(state)).toBe(2);
  });

  it("si aún no se conoce la página anterior, 'last' se resuelve cuando llega su mapa", () => {
    let state = readerReducer(guided({ page: 2, panelCounts: { 2: 2 } }), { type: "prev" });
    expect(state.panel).toBe("last");
    state = readerReducer(state, { type: "panelsLoaded", page: 1, count: 6 });
    expect(state.panel).toBe(5);
  });

  it("sin mapa de viñetas avanza de página en página", () => {
    const state = readerReducer(guided({ panelCounts: {} }), { type: "next" });
    expect(state.page).toBe(2);
  });

  it("no pasa de la última viñeta de la última página", () => {
    const state = guided({ page: 3, panel: 3 });
    expect(readerReducer(state, { type: "next" })).toBe(state);
  });

  it("cambiar de modo conserva una viñeta válida", () => {
    const state = readerReducer(guided({ panel: 9 }), { type: "setMode", mode: "guided" });
    expect(state.panel).toBe(2);
  });

  it("alterna los contornos de las viñetas", () => {
    const state = readerReducer(guided(), { type: "toggleOverlay" });
    expect(state.showPanels).toBe(true);
  });
});

describe("keyToAction", () => {
  it("en occidental la flecha derecha avanza", () => {
    expect(keyToAction("ArrowRight", false)).toEqual({ type: "next" });
    expect(keyToAction("ArrowLeft", false)).toEqual({ type: "prev" });
  });

  it("en manga la flecha izquierda avanza", () => {
    expect(keyToAction("ArrowLeft", true)).toEqual({ type: "next" });
    expect(keyToAction("ArrowRight", true)).toEqual({ type: "prev" });
  });

  it("espacio, A/D, Inicio y V", () => {
    expect(keyToAction(" ", true)).toEqual({ type: "next" });
    expect(keyToAction("a", false)).toEqual({ type: "prev" });
    expect(keyToAction("Home", false)).toEqual({ type: "goToPage", page: 1 });
    expect(keyToAction("v", false)).toEqual({ type: "toggleOverlay" });
    expect(keyToAction("x", false)).toBeNull();
  });
});
