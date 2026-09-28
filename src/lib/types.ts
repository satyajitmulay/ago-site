export type LogEntry = {
  id: string;
  at: number; // epoch ms when the user recorded the action
};

export type Thing = {
  id: string;
  name: string;
  icon: string; // key into ICONS registry
  intervalDays: number; // how often the user aims to do this
  logs: LogEntry[]; // newest first
  createdAt: number;
};

export type PersistedState = {
  version: 1;
  sample: boolean; // true while the user is still on sample data
  firstRunAt: number | null;
  things: Thing[];
};

export type Toast = {
  id: number;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
};
