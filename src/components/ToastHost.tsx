"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useApp } from "@/lib/store";

export default function ToastHost() {
  const { toasts, dismissToast } = useApp();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-5 z-[70] flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-ink/10 bg-ink px-4 py-3 text-paper shadow-pop"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">{t.title}</p>
              {t.body && (
                <p className="mt-0.5 truncate text-[13px] text-paper/70">
                  {t.body}
                </p>
              )}
            </div>
            {t.actionLabel && (
              <button
                type="button"
                onClick={() => {
                  t.onAction?.();
                  dismissToast(t.id);
                }}
                className="shrink-0 rounded-full bg-paper/15 px-3 py-1.5 text-[13px] font-semibold transition-colors hover:bg-paper/25"
              >
                {t.actionLabel}
              </button>
            )}
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss"
              className="grid size-7 shrink-0 place-items-center rounded-full text-paper/60 transition-colors hover:bg-paper/15 hover:text-paper"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
