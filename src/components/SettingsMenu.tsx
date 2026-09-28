"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Lock, RotateCcw, Settings2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";

export default function SettingsMenu() {
  const { clearAll, loadSample, pushToast, sample } = useApp();
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setConfirmClear(false);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Settings"
        className="grid size-10 place-items-center rounded-full border border-line bg-card text-ink-2 shadow-card transition-all duration-150 hover:text-ink hover:shadow-lift"
      >
        <Settings2 className="size-4.5" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 top-12 z-40 w-72 origin-top-right rounded-3xl border border-line bg-card p-2 shadow-pop"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                loadSample();
                pushToast({ title: "Sample data restored." });
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-well"
            >
              <RotateCcw className="size-4 text-ink-3" aria-hidden="true" />
              {sample ? "Reset the sample data" : "Load sample data"}
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                if (!confirmClear) {
                  setConfirmClear(true);
                  return;
                }
                clearAll();
                pushToast({ title: "Cleared.", body: "Your memory box is empty again." });
                setOpen(false);
              }}
              onBlur={() => setConfirmClear(false)}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                confirmClear
                  ? "bg-over-soft text-over"
                  : "text-ink hover:bg-well"
              }`}
            >
              <Trash2
                className={`size-4 ${confirmClear ? "text-over" : "text-ink-3"}`}
                aria-hidden="true"
              />
              {confirmClear ? "Really clear everything?" : "Start fresh — clear all"}
            </button>

            <div className="mt-1 flex items-start gap-2.5 border-t border-line px-3 pb-1.5 pt-3">
              <Lock className="mt-0.5 size-3.5 shrink-0 text-fresh" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-ink-3">
                Everything is saved only in this browser. No account, no cloud —
                yours alone.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
