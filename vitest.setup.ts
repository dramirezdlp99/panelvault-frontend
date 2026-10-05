import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Cada prueba empieza con el DOM y el almacenamiento limpios.
// Las pruebas del servidor corren en entorno "node", donde no existe window.
afterEach(() => {
  if (typeof window === "undefined") return;
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});
