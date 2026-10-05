import type { NextRequest } from "next/server";

import { forwardToBackend } from "@/server/backend/forward";

async function handle(request: NextRequest, context: RouteContext<"/api/pv/[...path]">) {
  const { path } = await context.params;
  return forwardToBackend(request, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
