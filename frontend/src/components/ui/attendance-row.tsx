import type { HTMLAttributes } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AttendanceRowProps = HTMLAttributes<HTMLDivElement> & {
  student: { id: string; name: string };
  mark: boolean | null;
  onMark: (present: boolean | null) => void;
};
function AttendanceRow({
  student,
  mark,
  onMark,
  className,
  ...props
}: AttendanceRowProps) {
  const set = (value: boolean) => onMark(mark === value ? null : value);
  return (
    <div
      className={cn(
        "flex min-h-16 items-center gap-3 border-b border-border px-4 py-2",
        mark === true && "bg-accent-wash",
        mark === false && "bg-danger-wash",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-sm font-semibold"
      >
        {student.name.charAt(0)}
      </span>
      <span className="min-w-0 flex-1 overflow-wrap-anywhere font-semibold">
        {student.name}
      </span>
      <span className="inline-flex rounded-[var(--r-sm)] border border-border bg-surface">
        <button
          type="button"
          className={cn(
            "flex min-h-touch min-w-[46px] items-center justify-center rounded-l-[var(--r-sm)] text-muted-foreground",
            mark === true && "bg-accent text-primary-foreground",
          )}
          aria-label={`Marcar ${student.name} como presente`}
          aria-pressed={mark === true}
          onClick={() => set(true)}
        >
          <Check />
        </button>
        <button
          type="button"
          className={cn(
            "flex min-h-touch min-w-[46px] items-center justify-center rounded-r-[var(--r-sm)] border-l border-border text-muted-foreground",
            mark === false && "bg-danger text-primary-foreground",
          )}
          aria-label={`Marcar ${student.name} como ausente`}
          aria-pressed={mark === false}
          onClick={() => set(false)}
        >
          <X />
        </button>
      </span>
    </div>
  );
}
function tallyMarks(marks: Array<boolean | null>, total = marks.length) {
  const present = marks.filter((mark) => mark === true).length;
  const absent = marks.filter((mark) => mark === false).length;
  return {
    present,
    absent,
    pending: total - present - absent,
    percentDone: total ? Math.round(((present + absent) / total) * 100) : 0,
  };
}
export { AttendanceRow, tallyMarks, type AttendanceRowProps };
