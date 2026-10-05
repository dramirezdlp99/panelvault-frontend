import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Estado vacío o de error: una viñeta punteada con ícono, título y una acción opcional. */
export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[var(--radius-panel)] border-[3px] border-dashed border-line bg-surface px-6 py-14 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-[var(--radius-panel)] border-2 border-line bg-highlight text-on-highlight shadow-hard">
        <Icon aria-hidden className="size-7" />
      </span>
      <h2 className="font-display text-2xl font-extrabold uppercase">{title}</h2>
      {children ? <div className="max-w-md text-ink-muted">{children}</div> : null}
      {action}
    </div>
  );
}
