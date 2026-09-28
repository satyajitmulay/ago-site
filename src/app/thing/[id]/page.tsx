"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CalendarClock, History, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useMemo, useState } from "react";
import FreshnessRing from "@/components/FreshnessRing";
import StampButton from "@/components/StampButton";
import StatusChip from "@/components/StatusChip";
import ThingSheet from "@/components/ThingSheet";
import ToastHost from "@/components/ToastHost";
import SettingsMenu from "@/components/SettingsMenu";
import { getIcon } from "@/lib/icons";
import { useApp } from "@/lib/store";
import {
  DAY,
  fullDate,
  getStatus,
  intervalLabel,
  statusLine,
  timeAgo,
  useNow,
} from "@/lib/time";

export default function ThingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { hydrated, things, stampThing, updateThing, removeThing, pushToast } =
    useApp();
  const now = useNow();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const thing = things.find((t) => t.id === id);

  const analysis = useMemo(() => {
    if (!thing) return null;
    const logs = thing.logs;
    const gaps: { days: number; from: number; to: number }[] = [];
    for (let i = logs.length - 1; i > 0; i -= 1) {
      const to = logs[i - 1].at;
      const from = logs[i].at;
      gaps.push({ days: Math.max(0, Math.round((to - from) / DAY)), from, to });
    }
    const avg =
      gaps.length > 0
        ? Math.round(gaps.reduce((s, g) => s + g.days, 0) / gaps.length)
        : null;
    return { gaps, avg };
  }, [thing]);

  if (!hydrated || now == null) {
    return (
      <div className="mx-auto max-w-5xl px-5 pt-6 sm:px-8">
        <div className="skeleton h-10 w-40 rounded-full" />
        <div className="skeleton mt-8 h-64 rounded-3xl border border-line" />
      </div>
    );
  }

  if (!thing) {
    return (
      <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
        <div>
          <p className="font-display text-3xl italic">This one slipped away.</p>
          <p className="mt-2 text-sm text-ink-3">
            It was probably deleted — nothing to worry about.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-fresh"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to your things
          </Link>
        </div>
      </div>
    );
  }

  const lastAt = thing.logs[0]?.at ?? null;
  const info = getStatus(lastAt, thing.intervalDays, now);
  const Icon = getIcon(thing.icon);
  const showHint =
    analysis &&
    analysis.avg != null &&
    analysis.gaps.length >= 2 &&
    Math.abs(analysis.avg - thing.intervalDays) / thing.intervalDays > 0.3;

  return (
    <div className="relative min-h-dvh">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 size-[440px] rounded-full border-[26px] border-fresh-soft/70"
      />
      <div className="relative mx-auto max-w-5xl px-5 pb-28 pt-6 sm:px-8">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold text-ink-2 shadow-card transition-all hover:text-ink hover:shadow-lift"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            All things
          </Link>
          <SettingsMenu />
        </header>

        <main className="mt-10 grid gap-6 lg:grid-cols-[minmax(320px,400px)_1fr]">
          {/* hero card */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            aria-label={thing.name}
            className="rounded-[28px] border border-line bg-card p-7 shadow-card lg:sticky lg:top-8 lg:self-start"
          >
            <div className="flex items-start justify-between">
              <FreshnessRing progress={info.progress} status={info.status} size={92} stroke={6}>
                <span className="grid size-14 place-items-center rounded-full bg-well text-ink-2">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
              </FreshnessRing>
              <StatusChip status={info.status} />
            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight">
              {thing.name}
            </h1>
            <p className="tnum mt-1 text-[34px] font-bold leading-none tracking-tight">
              {lastAt ? timeAgo(lastAt, now) : (
                <span className="text-2xl font-medium text-ink-3">Not stamped yet</span>
              )}
            </p>
            <p className="tnum mt-2 text-sm text-ink-3">
              {statusLine(info, thing.intervalDays)}
            </p>
            <p className="mt-1.5 text-[13px] text-ink-4">
              Recorded by you — Ago only knows what you tell it.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <StampButton
                size="lg"
                onClick={() => stampThing(thing.id)}
                aria-label={`Mark “${thing.name}” as done just now`}
              />
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                aria-label="Edit"
                className="grid size-11 place-items-center rounded-full border border-line bg-card text-ink-2 transition-colors hover:bg-well hover:text-ink"
              >
                <Pencil className="size-4.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    setTimeout(() => setConfirmDelete(false), 3000);
                    return;
                  }
                  removeThing(thing.id);
                  pushToast({ title: "Deleted.", body: `“${thing.name}” is gone.` });
                  router.push("/");
                }}
                aria-label={confirmDelete ? "Confirm delete" : "Delete"}
                className={`grid h-11 place-items-center rounded-full px-4 text-sm font-semibold transition-colors ${
                  confirmDelete
                    ? "bg-over text-paper"
                    : "border border-line bg-card text-ink-2 hover:bg-over-soft hover:text-over"
                }`}
              >
                {confirmDelete ? "Sure?" : <Trash2 className="size-4.5" aria-hidden="true" />}
              </button>
            </div>

            {/* stats */}
            <dl className="mt-7 grid grid-cols-3 gap-2 border-t border-line pt-5">
              {[
                { k: "stamps", v: String(thing.logs.length) },
                { k: "rhythm", v: intervalLabel(thing.intervalDays).replace("Every ", "") },
                {
                  k: "your avg",
                  v: analysis?.avg != null ? `${analysis.avg}d` : "—",
                },
              ].map((s) => (
                <div key={s.k}>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                    {s.k}
                  </dt>
                  <dd className="tnum mt-1 truncate text-lg font-bold">{s.v}</dd>
                </div>
              ))}
            </dl>
          </motion.section>

          <div className="flex flex-col gap-6">
            {/* rhythm */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.06, ease: "easeOut" }}
              aria-label="Rhythm"
              className="rounded-[28px] border border-line bg-card p-6 shadow-card sm:p-7"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-full bg-fresh-soft text-fresh">
                  <CalendarClock className="size-4.5" aria-hidden="true" />
                </span>
                <h2 className="text-lg font-bold tracking-tight">Rhythm</h2>
              </div>

              {analysis && analysis.gaps.length > 0 ? (
                <>
                  <p className="mt-3 text-sm leading-relaxed text-ink-2">
                    You aim for{" "}
                    <strong className="font-semibold">
                      {intervalLabel(thing.intervalDays).toLowerCase()}
                    </strong>
                    {analysis.avg != null && (
                      <>
                        {" "}· in practice it&apos;s about{" "}
                        <strong className="font-semibold">
                          every {analysis.avg} days
                        </strong>
                      </>
                    )}
                    .
                  </p>
                  <div
                    className="mt-5 flex h-24 items-end gap-1.5"
                    role="img"
                    aria-label={`Gaps between stamps in days: ${analysis.gaps
                      .map((g) => g.days)
                      .join(", ")}`}
                  >
                    {analysis.gaps.map((g, i) => {
                      const max = Math.max(...analysis.gaps.map((x) => x.days), 1);
                      return (
                        <motion.div
                          key={`${g.to}-${i}`}
                          initial={{ height: 0 }}
                          animate={{ height: `${10 + (g.days / max) * 86}%` }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 24,
                            delay: 0.1 + i * 0.04,
                          }}
                          title={`${g.days} days · ${fullDate(g.from)} → ${fullDate(g.to)}`}
                          className={`min-w-3 flex-1 rounded-t-md ${
                            g.days > thing.intervalDays ? "bg-over/70" : "bg-fresh/70"
                          }`}
                        />
                      );
                    })}
                  </div>
                  <p className="tnum mt-2 text-[12px] text-ink-4">
                    each bar = days between two stamps
                  </p>
                  {showHint && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-soon-soft px-4 py-3 text-sm">
                      <span className="text-ink-2">
                        Reality says <strong>~{analysis?.avg} days</strong>. Make
                        that the rhythm?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          updateThing(thing.id, {
                            intervalDays: analysis?.avg ?? thing.intervalDays,
                          });
                          pushToast({
                            title: "Rhythm updated.",
                            body: `Now tracking every ${analysis?.avg} days.`,
                          });
                        }}
                        className="rounded-full bg-ink px-3.5 py-1.5 text-[13px] font-semibold text-paper transition-colors hover:bg-fresh"
                      >
                        Use {analysis?.avg} days
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-ink-3">
                  Stamp this a couple of times and Ago will learn your real
                  rhythm — then show you the gap between intention and habit.
                </p>
              )}
            </motion.section>

            {/* history */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.12, ease: "easeOut" }}
              aria-label="History"
              className="rounded-[28px] border border-line bg-card p-6 shadow-card sm:p-7"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-full bg-well text-ink-2">
                  <History className="size-4.5" aria-hidden="true" />
                </span>
                <h2 className="text-lg font-bold tracking-tight">Recorded moments</h2>
              </div>

              {thing.logs.length === 0 ? (
                <p className="mt-3 text-sm text-ink-3">
                  Nothing yet. The first &ldquo;Did it&rdquo; starts this
                  timeline.
                </p>
              ) : (
                <ol className="mt-5 flex flex-col">
                  {thing.logs.slice(0, 24).map((log, i) => {
                    const prev = thing.logs[i + 1];
                    const gapDays = prev
                      ? Math.max(0, Math.round((log.at - prev.at) / DAY))
                      : null;
                    return (
                      <motion.li
                        key={log.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.035, duration: 0.25 }}
                        className="relative flex gap-4 pb-5 last:pb-0"
                      >
                        <span
                          aria-hidden="true"
                          className={`relative mt-1.5 flex size-3 shrink-0 rounded-full ${
                            i === 0 ? "bg-fresh" : "bg-line-2"
                          }`}
                        >
                          {i < thing.logs.length - 1 && (
                            <span className="absolute left-1/2 top-3 h-[calc(100%+1.25rem)] w-px -translate-x-1/2 bg-line" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-3">
                            <p className="tnum text-sm font-semibold">
                              {fullDate(log.at)}
                            </p>
                            <p className="tnum text-[13px] text-ink-3">
                              {timeAgo(log.at, now)}
                            </p>
                            {i === 0 && (
                              <span className="rounded-full bg-fresh-soft px-2 py-0.5 text-[11px] font-bold text-fresh">
                                latest
                              </span>
                            )}
                          </div>
                          {gapDays != null && (
                            <p className="tnum mt-0.5 text-[13px] text-ink-4">
                              {gapDays === 0
                                ? "same day as the previous one"
                                : `${gapDays} day${gapDays === 1 ? "" : "s"} after the previous one`}
                            </p>
                          )}
                        </div>
                      </motion.li>
                    );
                  })}
                </ol>
              )}
              {thing.logs.length > 24 && (
                <p className="tnum mt-3 text-[12px] text-ink-4">
                  + {thing.logs.length - 24} older records kept on this device
                </p>
              )}
            </motion.section>
          </div>
        </main>
      </div>

      <ThingSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={thing}
        onSubmit={(v) => {
          updateThing(thing.id, v);
          pushToast({ title: "Saved." });
        }}
      />
      <ToastHost />
    </div>
  );
}
