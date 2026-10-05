import { cn } from "@/shared/lib/cn";

import { passwordStrength } from "./validation";

const colors = ["bg-surface-muted", "bg-accent", "bg-highlight", "bg-ai", "bg-success"];

/** Medidor de 4 segmentos que se llena a medida que la contraseña mejora. */
export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label } = passwordStrength(password);
  return (
    <div className="flex items-center gap-3">
      <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={cn("h-2 rounded-full border border-line", segment <= score ? colors[score] : "bg-surface-muted")}
          />
        ))}
      </div>
      <span className="w-24 text-right font-mono text-xs font-semibold uppercase" aria-live="polite">
        {label}
      </span>
    </div>
  );
}
