"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { sampleThings } from "@/lib/sample";
import type { LogEntry, PersistedState, Thing, Toast } from "@/lib/types";

const KEY = "ago.v1";

type AddThingInput = { name: string; icon: string; intervalDays: number };

export type ImportResult = { ok: boolean; count: number; error?: string };

type AppContextValue = {
  hydrated: boolean;
  sample: boolean;
  things: Thing[];
  toasts: Toast[];
  addThing: (input: AddThingInput) => string;
  updateThing: (id: string, patch: Partial<Omit<Thing, "id" | "logs">>) => void;
  removeThing: (id: string) => void;
  stampThing: (id: string, at?: number) => void;
  clearAll: () => void;
  loadSample: () => void;
  exportData: () => string;
  importData: (json: string) => ImportResult;
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: number) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Strictly validate an imported backup file; returns null if the shape is wrong. */
function sanitizeBackup(
  raw: unknown,
): { things: Thing[]; sample: boolean; firstRunAt: number | null } | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.version !== 1 || !Array.isArray(r.things)) return null;

  const seen = new Set<string>();
  const things: Thing[] = [];
  for (const t of r.things) {
    if (!t || typeof t !== "object") return null;
    const o = t as Record<string, unknown>;
    if (typeof o.name !== "string" || o.name.trim().length === 0) return null;
    if (typeof o.intervalDays !== "number" || !Number.isFinite(o.intervalDays))
      return null;
    if (!Array.isArray(o.logs)) return null;

    const logs: LogEntry[] = o.logs
      .filter(
        (l): l is LogEntry =>
          !!l &&
          typeof l === "object" &&
          typeof (l as LogEntry).id === "string" &&
          typeof (l as LogEntry).at === "number" &&
          Number.isFinite((l as LogEntry).at),
      )
      .sort((a, b) => b.at - a.at);

    let id = typeof o.id === "string" ? o.id : uid();
    if (seen.has(id)) id = uid();
    seen.add(id);

    things.push({
      id,
      name: o.name.slice(0, 80),
      icon: typeof o.icon === "string" ? o.icon : "sparkles",
      intervalDays: Math.min(3650, Math.max(1, Math.round(o.intervalDays))),
      logs,
      createdAt:
        typeof o.createdAt === "number" && Number.isFinite(o.createdAt)
          ? o.createdAt
          : Date.now(),
    });
  }

  return {
    things,
    sample: r.sample === true,
    firstRunAt:
      typeof r.firstRunAt === "number" && Number.isFinite(r.firstRunAt)
        ? r.firstRunAt
        : Date.now(),
  };
}

function readPersisted(now: number): PersistedState {
  const blank: PersistedState = {
    version: 1,
    sample: true,
    firstRunAt: now,
    things: sampleThings(now),
  };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank;
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed?.version !== 1 || !Array.isArray(parsed.things)) return blank;
    return parsed;
  } catch {
    return blank;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [sample, setSample] = useState(true);
  const [firstRunAt, setFirstRunAt] = useState<number | null>(null);
  const [things, setThings] = useState<Thing[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  useEffect(() => {
    const s = readPersisted(Date.now());
    setThings(s.things);
    setSample(s.sample);
    setFirstRunAt(s.firstRunAt);
    setHydrated(true);
    // Ask the browser to protect this origin's data from pressure-based eviction.
    try {
      void navigator.storage?.persist?.().catch(() => {});
    } catch {
      // unsupported — harmless
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const state: PersistedState = { version: 1, sample, firstRunAt, things };
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // storage full/blocked — the app keeps working for this session
    }
  }, [hydrated, sample, firstRunAt, things]);

  const touch = useCallback(() => setSample(false), []);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = ++toastId.current;
      setToasts((t) => [...t.slice(-2), { ...toast, id }]);
      window.setTimeout(() => dismissToast(id), 6000);
    },
    [dismissToast],
  );

  const addThing = useCallback(
    (input: AddThingInput) => {
      const id = uid();
      const thing: Thing = {
        id,
        name: input.name.trim(),
        icon: input.icon,
        intervalDays: input.intervalDays,
        logs: [],
        createdAt: Date.now(),
      };
      setThings((t) => [thing, ...t]);
      touch();
      return id;
    },
    [touch],
  );

  const updateThing = useCallback(
    (id: string, patch: Partial<Omit<Thing, "id" | "logs">>) => {
      setThings((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      touch();
    },
    [touch],
  );

  const removeThing = useCallback(
    (id: string) => {
      setThings((ts) => ts.filter((t) => t.id !== id));
      touch();
    },
    [touch],
  );

  const stampThing = useCallback(
    (id: string, at?: number) => {
      const when = at ?? Date.now();
      setThings((ts) => {
        const target = ts.find((t) => t.id === id);
        if (!target) return ts;
        const prevLogs = target.logs;
        const entry: LogEntry = { id: uid(), at: when };
        const next = ts.map((t) =>
          t.id === id ? { ...t, logs: [entry, ...t.logs] } : t,
        );
        pushToast({
          title: "Recorded — nice.",
          body: `You marked “${target.name}” as done.`,
          actionLabel: "Undo",
          onAction: () => {
            setThings((cur) =>
              cur.map((t) => (t.id === id ? { ...t, logs: prevLogs } : t)),
            );
          },
        });
        return next;
      });
      touch();
    },
    [pushToast, touch],
  );

  const exportData = useCallback(() => {
    const state: PersistedState = { version: 1, sample, firstRunAt, things };
    return JSON.stringify(state, null, 2);
  }, [sample, firstRunAt, things]);

  const importData = useCallback(
    (json: string): ImportResult => {
      if (json.length > 5 * 1024 * 1024) {
        return { ok: false, count: 0, error: "That file is too large to be a backup." };
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch {
        return {
          ok: false,
          count: 0,
          error: "That file isn't readable — is it really an Ago backup?",
        };
      }
      const clean = sanitizeBackup(parsed);
      if (!clean) {
        return {
          ok: false,
          count: 0,
          error: "That file doesn't look like an Ago backup.",
        };
      }
      const prev: PersistedState = { version: 1, sample, firstRunAt, things };
      setThings(clean.things);
      setSample(clean.sample);
      setFirstRunAt(clean.firstRunAt);
      pushToast({
        title: "Backup restored.",
        body: `${clean.things.length} thing${clean.things.length === 1 ? "" : "s"} came along.`,
        actionLabel: "Undo",
        onAction: () => {
          setThings(prev.things);
          setSample(prev.sample);
          setFirstRunAt(prev.firstRunAt);
        },
      });
      return { ok: true, count: clean.things.length };
    },
    [sample, firstRunAt, things, pushToast],
  );

  const clearAll = useCallback(() => {
    setThings([]);
    setSample(false);
  }, []);

  const loadSample = useCallback(() => {
    setThings(sampleThings(Date.now()));
    setSample(true);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      hydrated,
      sample,
      things,
      toasts,
      addThing,
      updateThing,
      removeThing,
      stampThing,
      clearAll,
      loadSample,
      exportData,
      importData,
      pushToast,
      dismissToast,
    }),
    [
      hydrated,
      sample,
      things,
      toasts,
      addThing,
      updateThing,
      removeThing,
      stampThing,
      clearAll,
      loadSample,
      exportData,
      importData,
      pushToast,
      dismissToast,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
