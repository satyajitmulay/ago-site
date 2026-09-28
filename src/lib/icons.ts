import {
  AlarmSmoke,
  BatteryCharging,
  BedDouble,
  Brush,
  Car,
  Coffee,
  Droplets,
  Dumbbell,
  HardDrive,
  Key,
  Lock,
  PawPrint,
  Pill,
  Plug,
  Recycle,
  Shirt,
  Sparkles,
  Wind,
  type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  droplets: Droplets,
  coffee: Coffee,
  sparkles: Sparkles,
  "hard-drive": HardDrive,
  "paw-print": PawPrint,
  "bed-double": BedDouble,
  lock: Lock,
  wind: Wind,
  car: Car,
  pill: Pill,
  plug: Plug,
  "battery-charging": BatteryCharging,
  brush: Brush,
  shirt: Shirt,
  dumbbell: Dumbbell,
  recycle: Recycle,
  key: Key,
  "alarm-smoke": AlarmSmoke,
};

export const ICON_KEYS = Object.keys(ICONS);

export function getIcon(key: string): LucideIcon {
  return ICONS[key] ?? Sparkles;
}
