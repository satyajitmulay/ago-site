"use client";

import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import { FlaskConical, Lock, Plus, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import SettingsMenu from "@/components/SettingsMenu";
import ThingCard from "@/components/ThingCard";
import ThingSheet from "@/components/ThingSheet";
import ToastHost from "@/components/ToastHost";
import { useApp } from "@/lib/store";
import { getStatus, useNow, type Status } from "@/lib/time";
import type { Thing } from "@/lib/types";

const QUESTIONS = [
  "water the plants?",
  "back up the laptop?",
  "change the filter?",
  "descale the coffee machine?",
  "change the bedsheets?",
  "give Luna her meds?",
];

const RANK: Record<Status, number> = {
  over: 0,
  soon: 1,
  never: 2,
  good: 3,
  fresh: 4,
};

function Wordmark() {
  return (
    <div className="flex items-baseline gap-1.5 select-none" aria-label="Ago — home">
      <span className="font-display text-[30px] italic leading-none tracking-tight">
        ago
      </span>
      <span className="size-2 rounded-full bg-fresh" aria-hidden="true" />
    </div>
  );
}

function RotatingQuestion() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setI((v) => (v + 1) % QUESTIONS.length), 2600);
    return () => clearInterval(id);
  }, [reduce]);
  return (
    <span className="relative inline-block min-w-[5ch] align-baseline">
      <AnimatePresence mode="wait">
        <motion.span
          key={QUESTIONS[i]}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="inline-block font-display italic text-fresh"
        >
          {QUESTIONS[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function HomePage() {
  const { hydrated, sample, things, stampThing, addThing, clearAll, pushToast } =
    useApp();
  const now = useNow();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [frozen, setFrozen] = useState<Record<string, number | null>>({});

  const sorted = useMemo(() => {
    if (now == null) return things;
    const key = (t: Thing) => {
      const lastAt =
        t.id in frozen ? frozen[t.id] : (t.logs[0]?.at ?? null);
      const info = getStatus(lastAt, t.intervalDays, now);
      return { rank: RANK[info.status], info, t };
    };
    return [...things]
      .map(key)
      .sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        if (a.rank === 0) return b.info.daysOver - a.info.daysOver;
        if (a.rank === 2)
          return a.t.createdAt - b.t.createdAt;
        return b.info.progress - a.info.progress;
      })
      .map((x) => x.t);
  }, [things, now, frozen]);

  const summary = useMemo(() => {
    if (now == null) return { over: 0, soon: 0 };
    let over = 0;
    let soon = 0;
    for (const t of things) {
      const s = getStatus(t.logs[0]?.at ?? null, t.intervalDays, now).status;
      if (s === "over") over += 1;
      else if (s === "soon") soon += 1;
    }
    return { over, soon };
  }, [things, now]);

  return (
    <div className="relative min-h-dvh">
      {/* soft ring motif */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 size-[480px] rounded-full border-[28px] border-fresh-soft/70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-52 top-[38rem] size-[420px] rounded-full border-[24px] border-well"
      />

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-28 pt-6 sm:px-8">
        {/* header */}
        <header className="flex items-center justify-between">
          <Wordmark />
          <SettingsMenu />
        </header>

        <main className="mt-12 grid gap-x-14 gap-y-10 lg:mt-16 lg:grid-cols-[minmax(320px,400px)_1fr]">
          {/* left / hero column */}
          <div className="lg:sticky lg:top-10 lg:self-start">
            <h1 className="max-w-[13ch] text-4xl font-bold leading-[1.06] tracking-tight sm:text-[44px]">
              Stop wondering{" "}
              <span className="font-display italic font-medium">when</span> you
              last did it.
            </h1>
            <p className="mt-4 max-w-[40ch] text-[15px] leading-relaxed text-ink-2">
              Ago quietly remembers the repeat-y little things — plants,
              backups, filters — and shows what&apos;s fresh, due, or overdue at
              a glance. Recorded by you, one tap at a time.
            </p>
            <p className="mt-5 text-lg font-medium text-ink-2">
              When did you last <RotatingQuestion />
            </p>

            {/* status summary */}
            {hydrated && things.length > 0 && now != null && (
              <div className="mt-7 animate-fade-up" aria-live="polite">
                {summary.over + summary.soon === 0 ? (
                  <p className="inline-flex items-center gap-2 rounded-full bg-fresh-soft px-4 py-2 text-sm font-semibold text-fresh">
                    <Sparkles className="size-4" aria-hidden="true" />
                    Everything is fresh — nothing needs you right now.
                  </p>
                ) : (
                  <p className="tnum text-sm font-semibold text-ink-2">
                    <span className={summary.over ? "text-over" : ""}>
                      {summary.over} overdue
                    </span>
                    <span className="mx-2 text-ink-4" aria-hidden="true">
                      ·
                    </span>
                    <span className={summary.soon ? "text-soon" : ""}>
                      {summary.soon} due soon
                    </span>
                  </p>
                )}
              </div>
            )}

            <div className="mt-7">
              <motion.button
                type="button"
                onClick={() => setSheetOpen(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 500, damping: 26 }}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-paper shadow-lift transition-colors hover:bg-fresh"
              >
                <Plus className="size-4.5" strokeWidth={2.75} aria-hidden="true" />
                Track something
              </motion.button>
            </div>

            {sample && hydrated && (
              <div className="mt-8 flex items-start gap-3 rounded-3xl border border-line bg-card p-4 shadow-card animate-fade-up">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-soon-soft text-soon">
                  <FlaskConical className="size-4.5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold">
                    You&apos;re exploring sample data
                  </p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink-3">
                    Stamp things, edit them — or{" "}
                    <button
                      type="button"
                      onClick={() => {
                        clearAll();
                        pushToast({
                          title: "Started fresh.",
                          body: "Add your first thing whenever you're ready.",
                        });
                      }}
                      className="font-semibold text-fresh underline decoration-2 underline-offset-2 hover:text-ink"
                    >
                      start fresh
                    </button>{" "}
                    anytime.
                  </p>
                </div>
              </div>
            )}

            <p className="mt-8 hidden items-center gap-2 text-[13px] text-ink-3 lg:flex">
              <Lock className="size-3.5 text-fresh" aria-hidden="true" />
              Saved only in this browser. No account, no cloud.
            </p>
          </div>

          {/* right / list column */}
          <section aria-label="Your tracked things">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-[12px] font-bold uppercase tracking-[0.14em] text-ink-3">
                Your things
              </h2>
              {hydrated && things.length > 0 && (
                <p className="tnum text-[12px] text-ink-4">
                  {things.length} tracked · sorted by what needs you
                </p>
              )}
            </div>

            {!hydrated || now == null ? (
              <div className="flex flex-col gap-3" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="skeleton h-[108px] rounded-3xl border border-line"
                  />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid place-items-center rounded-3xl border border-dashed border-line-2 bg-card/60 px-6 py-16 text-center"
              >
                <div className="max-w-[34ch]">
                  <p className="font-display text-2xl italic">Your memory box is empty.</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-3">
                    Save the small repeat-y stuff you always forget — and future
                    you will never have to wonder again.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-fresh"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Track your first thing
                  </button>
                </div>
              </motion.div>
            ) : (
              <LayoutGroup>
                <motion.ul layout className="flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {sorted.map((t) => (
                      <motion.li
                        key={t.id}
                        layout
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{
                          layout: { type: "spring", stiffness: 320, damping: 32 },
                          opacity: { duration: 0.25 },
                        }}
                      >
                        <ThingCard
                          thing={t}
                          now={now}
                          onStamp={stampThing}
                          onStampStart={(id, prev) =>
                            setFrozen((f) => ({ ...f, [id]: prev }))
                          }
                          onMorphDone={(id) =>
                            setFrozen((f) => {
                              const next = { ...f };
                              delete next[id];
                              return next;
                            })
                          }
                        />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>
              </LayoutGroup>
            )}

            <p className="mt-10 flex items-center justify-center gap-2 text-[13px] text-ink-4 lg:hidden">
              <Lock className="size-3.5 text-fresh" aria-hidden="true" />
              Saved only in this browser.
            </p>
          </section>
        </main>
      </div>

      <ThingSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSubmit={(v) => {
          addThing(v);
          pushToast({
            title: "Now tracking.",
            body: `Stamp “${v.name}” the next time you do it.`,
          });
        }}
      />
      <ToastHost />
    </div>
  );
}
