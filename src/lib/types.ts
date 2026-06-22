export type ISODate = string; // YYYY-MM-DD
export type Timestamp = string; // ISO

export interface WaterLog {
  id: string;
  amountMl: number;
  at: Timestamp;
}

export interface WaterGoals {
  defaultMl: number;
  overrides: Partial<Record<Weekday, number>>; // by weekday
}

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type MealTag = "healthy" | "neutral" | "unhealthy";

export interface MealLog {
  id: string;
  name: string;
  tag: MealTag;
  at: Timestamp;
  notes?: string;
}

export interface WorkoutType {
  id: string;
  name: string;
  weeklyTarget: number;
  color?: string;
}

export interface WorkoutLog {
  id: string;
  typeId: string;
  date: ISODate;
  done: boolean;
  note?: string;
}

export interface BiometryEntry {
  id: string;
  at: Timestamp;
  weightKg?: number;
  heightCm?: number;
  waistCm?: number;
  chestCm?: number;
  hipCm?: number;
  armCm?: number;
  thighCm?: number;
  bodyFatPct?: number;
}

export type ActivityStatus = "pending" | "in_progress" | "done";
export type Recurrence =
  | { kind: "none" }
  | { kind: "daily" }
  | { kind: "weekdays"; days: Weekday[] };

export interface Activity {
  id: string;
  title: string;
  description?: string;
  status: ActivityStatus;
  dueAt?: Timestamp;
  recurrence: Recurrence;
  alertMinutesBefore?: number;
  completions: ISODate[]; // dates marked complete (for recurring)
  createdAt: Timestamp;
}

export interface Profile {
  name: string;
  createdAt: Timestamp;
}
