import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export type AlertTone = "error" | "warning" | "info" | "success";

const styles: Record<AlertTone, { box: string; icon: typeof Info }> = {
  error: { box: "border-accent bg-surface shadow-[4px_4px_0_0_var(--pv-accent)]", icon: CircleAlert },
  warning: { box: "border-line bg-highlight text-on-highlight shadow-hard", icon: TriangleAlert },
  info: { box: "border-ai bg-surface shadow-hard-ai", icon: Info },
  success: { box: "border-success bg-surface shadow-[4px_4px_0_0_var(--pv-success)]", icon: CircleCheck },
};

type AlertProps = { tone?: AlertTone; title?: string; children?: ReactNode; className?: string };

/** Mensaje destacado. Los errores se anuncian de inmediato a los lectores de pantalla. */
export function Alert({ tone = "info", title, children, className }: AlertProps) {
  const { box, icon: Icon } = styles[tone];
  return (
    <div
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-[var(--radius-panel)] border-2 p-4", box, className)}
    >
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div className="flex flex-col gap-1 text-sm">
        {title ? <p className="font-bold">{title}</p> : null}
        {children ? <div>{children}</div> : null}
      </div>
    </div>
  );
}
