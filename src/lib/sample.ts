import { DAY } from "@/lib/time";
import type { Thing } from "@/lib/types";

function logs(agesInDays: number[], now: number) {
  // jitter hours so timestamps feel human, newest first
  return agesInDays
    .map((d, i) => ({
      id: `sample-log-${d}-${i}`,
      at: now - d * DAY + ((i * 47) % 9) * 3_600_000 - 4 * 3_600_000,
    }))
    .sort((a, b) => b.at - a.at);
}

/** realistic starter set, anchored to "now" so the UI feels alive immediately */
export function sampleThings(now: number): Thing[] {
  return [
    {
      id: "sample-backup",
      name: "Back up my laptop",
      icon: "hard-drive",
      intervalDays: 14,
      logs: logs([23, 41, 67], now),
      createdAt: now - 70 * DAY,
    },
    {
      id: "sample-plants",
      name: "Water the plants",
      icon: "droplets",
      intervalDays: 4,
      logs: logs([2, 6, 11, 15], now),
      createdAt: now - 20 * DAY,
    },
    {
      id: "sample-flea",
      name: "Luna's flea treatment",
      icon: "paw-print",
      intervalDays: 30,
      logs: logs([31, 62, 95], now),
      createdAt: now - 100 * DAY,
    },
    {
      id: "sample-descale",
      name: "Descale the coffee machine",
      icon: "coffee",
      intervalDays: 30,
      logs: logs([26, 58], now),
      createdAt: now - 60 * DAY,
    },
    {
      id: "sample-sheets",
      name: "Change the bedsheets",
      icon: "bed-double",
      intervalDays: 7,
      logs: logs([5, 13, 21], now),
      createdAt: now - 25 * DAY,
    },
    {
      id: "sample-filter",
      name: "Change the water filter",
      icon: "wind",
      intervalDays: 90,
      logs: logs([96], now),
      createdAt: now - 100 * DAY,
    },
  ];
}
