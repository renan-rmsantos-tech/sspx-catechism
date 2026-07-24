import { useEffect, useState, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { getPendingSessionCount } from "@/lib/attendance-sync";

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

function NetworkChip({ className }: { className?: string }) {
  const [online, setOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine,
  );
  const [pending, setPending] = useState(0);
  useEffect(() => {
    const refresh = () =>
      void getPendingSessionCount()
        .then(setPending)
        .catch(() => undefined);
    const goOnline = () => {
      setOnline(true);
      refresh();
    };
    const goOffline = () => {
      setOnline(false);
      refresh();
    };
    refresh();
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
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
export { Chip, NetworkChip, chipVariants };
