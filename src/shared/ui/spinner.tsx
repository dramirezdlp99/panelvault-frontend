import { LoaderCircle } from "lucide-react";

import { cn } from "@/shared/lib/cn";

export function Spinner({ className, label = "Cargando" }: { className?: string; label?: string }) {
  return <LoaderCircle role="status" aria-label={label} className={cn("size-5 animate-spin", className)} />;
}
