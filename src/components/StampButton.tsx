"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function StampButton({
  onClick,
  disabled,
  "aria-label": ariaLabel,
  label = "Did it",
  busy = false,
  size = "md",
  className = "",
}: {
  onClick?: () => void;
  disabled?: boolean;
  "aria-label"?: string;
  label?: string;
  busy?: boolean;
  size?: "md" | "lg";
  className?: string;
}) {
  const off = disabled || busy;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={off}
      aria-label={ariaLabel}
      whileTap={off ? undefined : { scale: 0.94 }}
      whileHover={off ? undefined : { scale: 1.03 }}
      transition={{ type: "spring", stiffness: 500, damping: 26 }}
      className={[
        "group tnum inline-flex items-center justify-center gap-1.5 rounded-full font-semibold",
        "bg-ink text-paper shadow-[0_1px_2px_rgba(28,27,23,0.3)]",
        "transition-colors duration-150 hover:bg-fresh",
        "disabled:cursor-not-allowed disabled:opacity-60",
        size === "lg" ? "px-6 py-3 text-base" : "px-4 py-2 text-sm",
        className,
      ].join(" ")}
    >
      <Check
        className={`${size === "lg" ? "size-4.5" : "size-4"} transition-transform duration-150 group-hover:-rotate-6`}
        strokeWidth={3}
        aria-hidden="true"
      />
      {busy ? "Stamping…" : label}
    </motion.button>
  );
}
