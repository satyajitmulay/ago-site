"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useReducedMotion,
} from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import FreshnessRing from "@/components/FreshnessRing";
import StampButton from "@/components/StampButton";
import StatusChip from "@/components/StatusChip";
import { getIcon } from "@/lib/icons";
import { getStatus, statusLine, timeAgo, DAY, type Status } from "@/lib/time";
import type { Thing } from "@/lib/types";

export default function ThingCard({
  thing,
  now,
  onStamp,
  onStampStart,
  onMorphDone,
}: {
  thing: Thing;
  now: number;
  onStamp: (id: string) => void;
  /** freeze list ordering while the morph plays: (id, previous lastAt) */
  onStampStart?: (id: string, prevLastAt: number | null) => void;
  onMorphDone?: (id: string) => void;
}) {
  const reduce = useReducedMotion();
  const [morphMs, setMorphMs] = useState<number | null>(null);
  const [justStamped, setJustStamped] = useState(false);
  const [pulse, setPulse] = useState(0);
  const anchor = useRef(0); // captured "now" for morph math
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const lastAt = thing.logs[0]?.at ?? null;
  const info = getStatus(lastAt, thing.intervalDays, now);
  const Icon = getIcon(thing.icon);
  const morphing = morphMs !== null;

  const displayedTime =
    lastAt == null && !morphing
      ? null
      : morphing
        ? timeAgo(anchor.current - morphMs, anchor.current)
        : timeAgo(lastAt as number, now);

  function handleStamp() {
    if (morphing) return;
    const n = Date.now();
    anchor.current = n;
    const from = lastAt == null ? thing.intervalDays * DAY : Math.max(0, n - lastAt);

    onStampStart?.(thing.id, lastAt);
    onStamp(thing.id); // commit immediately; toast & undo live in the store
    setPulse((p) => p + 1);

    const finish = () => {
      setMorphMs(null);
      setJustStamped(true);
      timers.current.push(
        setTimeout(() => {
          setJustStamped(false);
          onMorphDone?.(thing.id);
        }, 1500),
      );
    };

    if (reduce || from < DAY / 2) {
      finish();
      return;
    }
    setMorphMs(from);
    animate(from, 0, {
      duration: 0.75,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setMorphMs(v),
      onComplete: finish,
    });
  }

  const status: Status = morphing || justStamped ? "fresh" : info.status;

  return (
    <motion.div
      whileHover={{ y: reduce ? 0 : -2 }}
      transition={{ type: "spring", stiffness: 350, damping: 26 }}
      className="group relative rounded-3xl border border-line bg-card p-4 shadow-card transition-shadow duration-200 hover:shadow-lift sm:p-5"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        {/* ring + icon + shockwave */}
        <div className="relative">
          <FreshnessRing
            progress={morphing || justStamped ? 0 : info.progress}
            status={status}
            size={56}
          >
            <AnimatePresence mode="wait" initial={false}>
              {justStamped ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className="grid size-8 place-items-center rounded-full bg-fresh text-paper"
                >
                  <Check className="size-4.5" strokeWidth={3.5} aria-hidden="true" />
                </motion.span>
              ) : (
                <motion.span
                  key="icon"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="grid size-9 place-items-center rounded-full bg-well text-ink-2"
                >
                  <Icon className="size-4.5" aria-hidden="true" />
                </motion.span>
              )}
            </AnimatePresence>
          </FreshnessRing>
          <AnimatePresence>
            {pulse > 0 && (
              <motion.span
                key={pulse}
                initial={{ scale: 0.85, opacity: 0.55 }}
                animate={{ scale: 1.9, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="pointer-events-none absolute inset-0 rounded-full border-2 border-fresh"
                aria-hidden="true"
              />
            )}
          </AnimatePresence>
        </div>

        {/* words */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/thing/${thing.id}`}
              className="truncate text-[15px] font-semibold text-ink decoration-fresh decoration-2 underline-offset-4 hover:underline"
            >
              {thing.name}
            </Link>
            <ArrowUpRight
              className="size-3.5 shrink-0 text-ink-4 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
              aria-hidden="true"
            />
            <StatusChip status={status} />
          </div>
          <div
            className="tnum mt-1 text-[22px] font-bold leading-tight tracking-tight"
            aria-live="polite"
          >
            {displayedTime ?? (
              <span className="text-lg font-medium text-ink-3">
                Not stamped yet
              </span>
            )}
          </div>
          <p className="tnum mt-0.5 text-[13px] text-ink-3">
            {morphing || justStamped
              ? "recorded by you, just now"
              : statusLine(info, thing.intervalDays)}
          </p>
        </div>

        {/* action */}
        <StampButton
          onClick={handleStamp}
          busy={morphing}
          aria-label={`Mark “${thing.name}” as done just now`}
        />
      </div>
    </motion.div>
  );
}
