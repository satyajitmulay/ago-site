import { useEffect, useState } from "react";

export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

/** "Just now", "5 min ago", "Yesterday", "23 days ago", "2 wk ago", "3 mo ago" */
export function timeAgo(ts: number, now: number): string {
  const diff = Math.max(0, now - ts);
  if (diff < 90_000) return "Just now";
  if (diff < HOUR) {
    const m = Math.round(diff / MIN);
    return `${m} min ago`;
  }
  if (diff < DAY) {
    const h = Math.round(diff / HOUR);
    return h === 1 ? "An hour ago" : `${h} hr ago`;
  }
  if (diff < 2 * DAY) return "Yesterday";
  if (diff < 14 * DAY) {
    const d = Math.floor(diff / DAY);
    return `${d} days ago`;
  }
  if (diff < 60 * DAY) {
    const w = Math.round(diff / (7 * DAY));
    return w === 1 ? "A week ago" : `${w} wk ago`;
  }
  if (diff < 365 * DAY) {
    const mo = Math.round(diff / (30.4 * DAY));
    return `${mo} mo ago`;
  }
  const y = Math.round(diff / (365 * DAY));
  return y === 1 ? "A year ago" : `${y} yr ago`;
}

/** Short absolute label: "Wed 24 Sep, 9:41 PM" */
export function fullDate(ts: number): string {
  const d = new Date(ts);
  const date = d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date}, ${time}`;
}

export type Status = "never" | "fresh" | "good" | "soon" | "over";

export type StatusInfo = {
  status: Status;
  /** elapsed as a fraction of the interval (can exceed 1) */
  progress: number;
  /** whole days since last stamp */
  daysSince: number;
  /** whole days overdue (0 when not overdue) */
  daysOver: number;
  /** days remaining until due (0 when due/over) */
  daysLeft: number;
};

export function getStatus(
  lastAt: number | null,
  intervalDays: number,
  now: number,
): StatusInfo {
  if (lastAt == null) {
    return { status: "never", progress: 0, daysSince: 0, daysOver: 0, daysLeft: intervalDays };
  }
  const elapsed = Math.max(0, now - lastAt);
  const interval = Math.max(1, intervalDays) * DAY;
  const progress = elapsed / interval;
  const daysSince = Math.floor(elapsed / DAY);
  const daysOver = Math.max(0, Math.ceil(elapsed / DAY - intervalDays));
  const daysLeft = Math.max(0, Math.ceil((interval - elapsed) / DAY));
  let status: Status = "fresh";
  if (progress >= 1) status = "over";
  else if (progress >= 0.75) status = "soon";
  else if (progress >= 0.3) status = "good";
  return { status, progress, daysSince, daysOver, daysLeft };
}

export const STATUS_LABEL: Record<Status, string> = {
  never: "Not yet",
  fresh: "Fresh",
  good: "On track",
  soon: "Due soon",
  over: "Overdue",
};

/** contextual caption under the relative time, e.g. "every 14 days · 9 days overdue" */
export function statusLine(info: StatusInfo, intervalDays: number): string {
  const every = `every ${intervalDays === 1 ? "day" : `${intervalDays} days`}`;
  switch (info.status) {
    case "never":
      return `aim for ${every}`;
    case "fresh":
      return `fresh · ${every}`;
    case "good":
      return `${every} · ~${info.daysLeft}d left`;
    case "soon":
      return info.daysLeft <= 1 ? `due today · ${every}` : `${every} · due in ~${info.daysLeft}d`;
    case "over":
      return info.daysOver === 0 ? `due today · ${every}` : `${every} · ${info.daysOver}d overdue`;
  }
}

/** "every day", "every 2 weeks" style phrasing for presets */
export function intervalLabel(days: number): string {
  if (days === 1) return "Daily";
  if (days === 3) return "Every few days";
  if (days === 7) return "Weekly";
  if (days === 14) return "Every 2 weeks";
  if (days === 30) return "Monthly";
  if (days === 90) return "Every 3 months";
  return `Every ${days} days`;
}

/** ticks `now` on an interval; returns null until mounted (hydration-safe) */
export function useNow(tick = 30_000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), tick);
    return () => clearInterval(id);
  }, [tick]);
  return now;
}
