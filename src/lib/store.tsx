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
