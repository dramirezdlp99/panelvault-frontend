/**
 * Estado del lector como una máquina de estados pura (reducer): fácil de probar y
 * sin sorpresas. La página es 1-based (como la muestra la interfaz y la espera el backend);
 * la viñeta es el índice dentro del mapa de viñetas de esa página.
 */
export type ReaderMode = "page" | "guided";

export type ReaderState = {
  page: number;
  totalPages: number;
  /** Viñeta actual; "last" = la última de la página (se resuelve cuando llega su mapa). */
  panel: number | "last";
  mode: ReaderMode;
  showPanels: boolean;
  /** Cantidad de viñetas por página ya conocida (de los mapas cargados). */
  panelCounts: Record<number, number>;
};

export type ReaderAction =
  | { type: "next" }
  | { type: "prev" }
  | { type: "goToPage"; page: number }
  | { type: "setMode"; mode: ReaderMode }
  | { type: "toggleOverlay" }
  | { type: "panelsLoaded"; page: number; count: number };

export function initialReaderState(totalPages: number, page = 1, panel = 0, mode: ReaderMode = "page"): ReaderState {
  return { page: clamp(page, 1, Math.max(1, totalPages)), totalPages, panel: Math.max(0, panel), mode, showPanels: false, panelCounts: {} };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? Math.round(value) : min));
}

/** Índice de viñeta concreto para la página actual, si ya se conoce cuántas tiene. */
export function resolvedPanel(state: ReaderState): number {
  const count = state.panelCounts[state.page];
  if (state.panel === "last") return count ? count - 1 : 0;
  return count ? Math.min(state.panel, count - 1) : state.panel;
}

function goTo(state: ReaderState, page: number, panel: number | "last"): ReaderState {
  return { ...state, page, panel };
}

export function readerReducer(state: ReaderState, action: ReaderAction): ReaderState {
  switch (action.type) {
    case "next": {
      if (state.mode === "guided") {
        const count = state.panelCounts[state.page];
        const current = resolvedPanel(state);
        if (count && current < count - 1) return { ...state, panel: current + 1 };
      }
      return state.page < state.totalPages ? goTo(state, state.page + 1, 0) : state;
    }
    case "prev": {
      if (state.mode === "guided") {
        const current = resolvedPanel(state);
        if (state.panelCounts[state.page] && current > 0) return { ...state, panel: current - 1 };
        return state.page > 1 ? goTo(state, state.page - 1, "last") : { ...state, panel: 0 };
      }
      return state.page > 1 ? goTo(state, state.page - 1, 0) : state;
    }
    case "goToPage":
      return goTo(state, clamp(action.page, 1, state.totalPages), 0);
    case "setMode":
      return { ...state, mode: action.mode, panel: action.mode === "guided" ? resolvedPanel(state) : state.panel };
    case "toggleOverlay":
      return { ...state, showPanels: !state.showPanels };
    case "panelsLoaded": {
      const panelCounts = { ...state.panelCounts, [action.page]: action.count };
      const next = { ...state, panelCounts };
      // Al conocer cuántas viñetas tiene la página actual, "last" se vuelve un índice real.
      return action.page === state.page && state.panel === "last" ? { ...next, panel: Math.max(0, action.count - 1) } : next;
    }
  }
}

/** En manga se lee de derecha a izquierda: la flecha izquierda avanza. */
export function keyToAction(key: string, rightToLeft: boolean): ReaderAction | null {
  switch (key) {
    case "ArrowRight":
      return { type: rightToLeft ? "prev" : "next" };
    case "ArrowLeft":
      return { type: rightToLeft ? "next" : "prev" };
    case " ":
    case "d":
    case "D":
    case "PageDown":
      return { type: "next" };
    case "a":
    case "A":
    case "PageUp":
      return { type: "prev" };
    case "Home":
      return { type: "goToPage", page: 1 };
    case "v":
    case "V":
      return { type: "toggleOverlay" };
    default:
      return null;
  }
}
