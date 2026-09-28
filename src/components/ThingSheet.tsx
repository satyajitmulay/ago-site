"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getIcon, ICON_KEYS } from "@/lib/icons";
import { intervalLabel } from "@/lib/time";
import type { Thing } from "@/lib/types";

const PRESETS = [1, 3, 7, 14, 30, 90];

export default function ThingSheet({
  open,
  onClose,
  onSubmit,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (v: { name: string; icon: string; intervalDays: number }) => void;
  initial?: Thing | null;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("droplets");
  const [preset, setPreset] = useState<number | "custom">(7);
  const [customDays, setCustomDays] = useState("10");
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setIcon(initial?.icon ?? "droplets");
    setError(null);
    if (initial && !PRESETS.includes(initial.intervalDays)) {
      setPreset("custom");
      setCustomDays(String(initial.intervalDays));
    } else {
      setPreset(initial?.intervalDays ?? 7);
      setCustomDays("10");
    }
    const t = setTimeout(() => nameRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give it a name — future-you will thank you.");
      nameRef.current?.focus();
      return;
    }
    const days =
      preset === "custom" ? Number.parseInt(customDays, 10) : preset;
    if (!Number.isFinite(days) || days < 1 || days > 3650) {
      setError("How often? Pick between 1 and 3650 days.");
      return;
    }
    onSubmit({ name: trimmed, icon, intervalDays: days });
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-0 backdrop-blur-[3px] sm:items-center sm:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={initial ? "Edit thing" : "Track something new"}
            initial={{ y: 48, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 32, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="w-full max-w-lg rounded-t-[28px] border border-line bg-card p-6 shadow-pop sm:rounded-[28px] sm:p-7"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  {initial ? "Edit thing" : "Track something new"}
                </h2>
                <p className="mt-1 text-sm text-ink-3">
                  {initial
                    ? "Rename it, change its icon or rhythm."
                    : "Something small you keep forgetting when you last did."}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-9 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-well hover:text-ink"
              >
                <X className="size-4.5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={submit} noValidate>
              <label
                htmlFor="thing-name"
                className="mb-1.5 block text-[13px] font-semibold text-ink-2"
              >
                What is it?
              </label>
              <input
                ref={nameRef}
                id="thing-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Water the plants, back up my laptop…"
                maxLength={60}
                className="w-full rounded-2xl border border-line-2 bg-paper px-4 py-3 text-[15px] placeholder:text-ink-4 focus:border-fresh focus:outline-none"
              />
              {error && (
                <p role="alert" className="mt-2 text-[13px] font-medium text-over">
                  {error}
                </p>
              )}

              <fieldset className="mt-5">
                <legend className="mb-1.5 text-[13px] font-semibold text-ink-2">
                  Pick an icon
                </legend>
                <div className="grid grid-cols-9 gap-1.5 max-[420px]:grid-cols-6">
                  {ICON_KEYS.map((key) => {
                    const Ico = getIcon(key);
                    const active = key === icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setIcon(key)}
                        aria-pressed={active}
                        aria-label={`Icon ${key.replaceAll("-", " ")}`}
                        className={`grid aspect-square place-items-center rounded-xl transition-all duration-150 ${
                          active
                            ? "bg-ink text-paper shadow-sm"
                            : "bg-well text-ink-3 hover:bg-line hover:text-ink"
                        }`}
                      >
                        <Ico className="size-4.5" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="mt-5">
                <legend className="mb-1.5 text-[13px] font-semibold text-ink-2">
                  How often, roughly?
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setPreset(d)}
                      aria-pressed={preset === d}
                      className={`rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all duration-150 ${
                        preset === d
                          ? "bg-ink text-paper shadow-sm"
                          : "bg-well text-ink-2 hover:bg-line"
                      }`}
                    >
                      {intervalLabel(d)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPreset("custom")}
                    aria-pressed={preset === "custom"}
                    className={`rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all duration-150 ${
                      preset === "custom"
                        ? "bg-ink text-paper shadow-sm"
                        : "bg-well text-ink-2 hover:bg-line"
                    }`}
                  >
                    Custom
                  </button>
                </div>
                {preset === "custom" && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-ink-3">Every</span>
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={customDays}
                      onChange={(e) =>
                        setCustomDays(e.target.value.replace(/[^0-9]/g, ""))
                      }
                      aria-label="Custom interval in days"
                      className="tnum w-20 rounded-xl border border-line-2 bg-paper px-3 py-2 text-center text-[15px] focus:border-fresh focus:outline-none"
                    />
                    <span className="text-sm text-ink-3">days</span>
                  </div>
                )}
              </fieldset>

              <div className="mt-7 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full px-4 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:bg-well"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper shadow-sm transition-colors hover:bg-fresh"
                >
                  {initial ? "Save changes" : "Start tracking"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
