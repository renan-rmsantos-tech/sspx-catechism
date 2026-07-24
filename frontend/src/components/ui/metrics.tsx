import { cn } from "@/lib/utils";
function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}
function StatCard({
  value,
  label,
  unit,
  className,
}: {
  value: string | number;
  label: string;
  unit?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--r-lg)] border border-border bg-surface p-4",
        className,
      )}
    >
      <strong className="num block text-3xl font-[640] tracking-tight">
        {value}
        {unit ? (
          <small className="ml-0.5 text-base font-normal text-muted-foreground">
            {unit}
          </small>
        ) : null}
      </strong>
      <span className="mt-1 block text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
function Meter({
  percent,
  label,
  target = 75,
}: {
  percent: number;
  label: string;
  target?: number;
}) {
  const value = clampPercent(percent);
  const tone =
    value >= target
      ? "bg-accent"
      : value >= target - 15
        ? "bg-warn"
        : "bg-danger";
  return (
    <div className="grid gap-2">
      <div className="flex justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="num font-semibold">{value}%</span>
      </div>
      <div
        role="img"
        aria-label={`${value} por cento${value < target ? ", abaixo do esperado" : ""}`}
        className="h-2 overflow-hidden rounded-full bg-surface-3"
      >
        <div
          data-testid="meter-fill"
          className={cn(
            "h-full rounded-full transition-[width] duration-[var(--dur)]",
            tone,
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
type Bar = { label: string; value: number; muted?: boolean };
function BarChart({
  data,
  max,
  label,
}: {
  data: Bar[];
  max?: number;
  label?: string;
}) {
  const ceiling = max ?? Math.max(1, ...data.map((point) => point.value));
  const description =
    label ?? data.map((point) => `${point.label} ${point.value}`).join(", ");
  return (
    <div
      role="img"
      aria-label={description}
      className="grid h-48 grid-cols-[repeat(var(--bars),minmax(0,1fr))] items-end gap-2"
      style={{ "--bars": data.length } as React.CSSProperties}
    >
      {data.map((point, index) => {
        const height = clampPercent((point.value / ceiling) * 100);
        return (
          <div
            key={point.label}
            className="grid h-full grid-rows-[auto_1fr_auto] gap-1 text-center"
          >
            <span className="num text-xs font-semibold">{point.value}</span>
            <span className="flex items-end rounded-t-[var(--r-sm)] bg-surface-3">
              <i
                data-testid={`bar-${index}`}
                className={cn(
                  "block w-full rounded-t-[var(--r-sm)] bg-accent",
                  (point.muted || index === data.length - 1) &&
                    "bg-accent-line",
                )}
                style={{ height: `${height}%` }}
              />
            </span>
            <span className="num text-xs text-muted-foreground">
              {point.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
function ProgressRail({ done, total }: { done: number; total: number }) {
  const percent = total ? clampPercent(Math.round((done / total) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label="Alunos marcados"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      className="h-1 overflow-hidden bg-surface-3"
    >
      <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
    </div>
  );
}
export { StatCard, Meter, BarChart, ProgressRail };
