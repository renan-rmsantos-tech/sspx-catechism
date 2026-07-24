import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "grid place-items-center gap-3 rounded-[var(--r-lg)] border border-dashed border-border bg-surface p-8 text-center",
        className,
      )}
    >
      {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      <div>
        <h2 className="text-base">{title}</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </section>
  );
}
export { EmptyState };
