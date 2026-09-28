import { STATUS_LABEL, type Status } from "@/lib/time";

const TONE: Record<Status, string> = {
  never: "bg-well text-ink-3",
  fresh: "bg-fresh-soft text-fresh",
  good: "bg-fresh-soft text-fresh",
  soon: "bg-soon-soft text-soon",
  over: "bg-over-soft text-over",
};

export default function StatusChip({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${TONE[status]}`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${
          status === "over"
            ? "bg-over motion-safe:animate-pulse"
            : status === "soon"
              ? "bg-soon"
              : status === "never"
                ? "bg-ink-4"
                : "bg-fresh"
        }`}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}
