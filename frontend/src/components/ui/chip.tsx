import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
  {
    variants: {
      tone: {
        neutral: "bg-surface-2 text-muted-foreground",
        ok: "bg-accent-soft text-accent-ink",
        warn: "bg-warn-soft text-warn-ink",
        danger: "bg-danger-soft text-danger-ink",
        info: "bg-info-soft text-info-ink",
        gold: "bg-gold-soft text-gold-ink",
      },
      dot: {
        true: "before:size-1.5 before:rounded-full before:bg-current",
        false: "",
      },
    },
    defaultVariants: { tone: "neutral", dot: true },
  },
);
function Chip({
  className,
  tone,
  dot,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof chipVariants>) {
  return (
    <span
      data-slot="chip"
      className={cn(chipVariants({ tone, dot, className }))}
      {...props}
    />
  );
}

/** O chip de rede, puro: quem está conectado ao aparelho é `NetworkChip`. */
function NetworkStatusChip({
  online,
  pending,
  className,
}: {
  online: boolean;
  pending: number;
  className?: string;
}) {
  return (
    <Chip
      className={className}
      tone={online ? "ok" : "warn"}
      data-od-id="network-chip"
    >
      {online ? "Online" : "Offline"}
      {pending > 0 ? <span className="num">· {pending}</span> : null}
    </Chip>
  );
}
export { Chip, NetworkStatusChip, chipVariants };
