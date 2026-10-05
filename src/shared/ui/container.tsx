import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

/** Ancho máximo y márgenes laterales comunes a todas las páginas. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-10", className)} {...props} />;
}
