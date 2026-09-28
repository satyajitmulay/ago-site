"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { Status } from "@/lib/time";

const STATUS_COLOR: Record<Status, string> = {
  never: "var(--color-line-2)",
  fresh: "var(--color-fresh)",
  good: "var(--color-fresh)",
  soon: "var(--color-soon)",
  over: "var(--color-over)",
};

export default function FreshnessRing({
  progress,
  status,
  size = 56,
  stroke = 4.5,
  animate = true,
  children,
}: {
  /** elapsed as fraction of interval; >1 means overdue */
  progress: number;
  status: Status;
  size?: number;
  stroke?: number;
  animate?: boolean;
  children?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = status === "never" ? 0 : Math.min(1, Math.max(0, progress));
  const offset = c * (1 - filled);

  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-well)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={STATUS_COLOR[status]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={
            reduce || !animate
              ? { duration: 0 }
              : { type: "spring", stiffness: 120, damping: 22, mass: 0.9 }
          }
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
