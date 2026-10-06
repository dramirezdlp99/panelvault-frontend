import { NextResponse } from "next/server";

import { BackendUnavailableError, backendFetch } from "@/server/backend/client";

/**
 * "Despierta" al backend: la portada lo llama apenas se abre, así cuando la persona
 * llegue a iniciar sesión el backend ya está encendido (en Render gratuito duerme).
 * Usa /actuator/health, que no requiere sesión y está exento de la firma del gateway.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await backendFetch({ path: "/actuator/health" });
    return NextResponse.json(
      { status: response.ok ? "ok" : "degraded" },
      { status: response.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BackendUnavailableError) {
      return NextResponse.json({ status: "down" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    throw error;
  }
}
