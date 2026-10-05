import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse } from "@/test/jwt";
import { nextNavigationMock, resetRouter } from "@/test/router";

import { SecurityPanel } from "./security-panel";

vi.mock("next/navigation", () => nextNavigationMock());
vi.mock("qrcode", () => ({ default: { toString: vi.fn(async () => "<svg data-testid='qr'></svg>") } }));

type Route = (url: string, init?: RequestInit) => Response | undefined;
let routes: Route[];
beforeEach(() => {
  resetRouter();
  routes = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      for (const route of routes) {
        const reply = route(url, init);
        if (reply) return reply;
      }
      return jsonResponse({ status: 404, code: "x", message: "sin ruta" }, 404);
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("SecurityPanel", () => {
  it("activa la verificacion en tres pasos y muestra los codigos", async () => {
    let enabled = false;
    routes.push((url) => (url === "/api/pv/me/2fa" ? jsonResponse({ enabled, recoveryCodesRemaining: enabled ? 10 : 0 }) : undefined));
    routes.push((url) =>
      url === "/api/pv/me/2fa/setup" ? jsonResponse({ secret: "JBSWY3DPEHPK3PXP", otpauthUri: "otpauth://totp/x" }) : undefined,
    );
    routes.push((url, init) => {
      if (url !== "/api/pv/me/2fa/confirm") return undefined;
      expect(JSON.parse(String(init?.body))).toEqual({ code: "654321" });
      enabled = true;
      return jsonResponse({ recoveryCodes: Array.from({ length: 10 }, (_, i) => `CODIGO${i}`) });
    });

    const user = userEvent.setup();
    render(<SecurityPanel />);
    await user.click(await screen.findByRole("button", { name: /activar verificación/i }));
    expect(await screen.findByText("JBSW Y3DP EHPK 3PXP")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ya lo escaneé" }));
    await user.click(screen.getByLabelText("Dígito 1 de 6"));
    await user.keyboard("654321");

    expect(await screen.findByText("CODIGO0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Terminar" })).toBeDisabled();
    await user.click(screen.getByLabelText("Ya guardé mis códigos en un lugar seguro"));
    await user.click(screen.getByRole("button", { name: "Terminar" }));
    expect(await screen.findByText("Activada")).toBeInTheDocument();
    expect(screen.getByText("Zona de peligro")).toBeInTheDocument();
  });

  it("advierte cuando quedan pocos codigos de recuperacion", async () => {
    routes.push((url) => (url === "/api/pv/me/2fa" ? jsonResponse({ enabled: true, recoveryCodesRemaining: 1 }) : undefined));
    render(<SecurityPanel />);
    expect(await screen.findByText("Te quedan pocos códigos de recuperación")).toBeInTheDocument();
  });

  it("desactiva con un codigo valido", async () => {
    let enabled = true;
    routes.push((url) => (url === "/api/pv/me/2fa" ? jsonResponse({ enabled, recoveryCodesRemaining: 8 }) : undefined));
    routes.push((url) => {
      if (url !== "/api/pv/me/2fa/disable") return undefined;
      enabled = false;
      return new Response(null, { status: 204 });
    });
    const user = userEvent.setup();
    render(<SecurityPanel />);
    await user.type(await screen.findByLabelText("Código de la app o de recuperación"), "123456");
    await user.click(screen.getByRole("button", { name: /desactivar/i }));
    expect(await screen.findByText("Desactivada")).toBeInTheDocument();
  });

  it("muestra el error si el codigo no es valido", async () => {
    routes.push((url) => (url === "/api/pv/me/2fa" ? jsonResponse({ enabled: true, recoveryCodesRemaining: 8 }) : undefined));
    routes.push((url) =>
      url === "/api/pv/me/2fa/disable" ? jsonResponse({ status: 400, code: "auth.invalid_2fa_code", message: "x" }, 400) : undefined,
    );
    const user = userEvent.setup();
    render(<SecurityPanel />);
    await user.type(await screen.findByLabelText("Código de la app o de recuperación"), "000000");
    await user.click(screen.getByRole("button", { name: /desactivar/i }));
    expect(await screen.findByText("El código de verificación no es válido.")).toBeInTheDocument();
  });
});
