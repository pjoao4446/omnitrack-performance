import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Activity,
  BiometryEntry,
  MealLog,
  MealTag,
  Profile,
  WaterGoals,
  WaterLog,
  Weekday,
  WorkoutLog,
  WorkoutType,
} from "./types";
import { todayISO, weekdayOf } from "./date";

const uid = () => Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
const nowISO = () => new Date().toISOString();

interface State {
  profile: Profile;
  setProfileName: (name: string) => void;

  // Water
  water: WaterLog[];
  waterGoals: WaterGoals;
  addWater: (amountMl: number, dateISO?: string) => void;
  updateWater: (id: string, patch: { amountMl?: number; at?: string }) => void;
  removeWater: (id: string) => void;
  setWaterDefault: (ml: number) => void;
  setWaterOverride: (day: Weekday, ml: number | null) => void;

  // Nutrition
  meals: MealLog[];
  addMeal: (input: { name: string; tag: MealTag; notes?: string }) => void;
  updateMeal: (id: string, patch: Partial<MealLog>) => void;
  removeMeal: (id: string) => void;

  // Workouts
  workoutTypes: WorkoutType[];
  workoutLogs: WorkoutLog[];
  addWorkoutType: (input: { name: string; weeklyTarget: number }) => void;
  updateWorkoutType: (id: string, patch: Partial<WorkoutType>) => void;
  removeWorkoutType: (id: string) => void;
  toggleWorkoutLog: (typeId: string, date: string, note?: string) => void;
  setWorkoutNote: (typeId: string, date: string, note: string) => void;

  // Biometry
  biometry: BiometryEntry[];
  addBiometry: (input: Omit<BiometryEntry, "id" | "at"> & { at?: string }) => void;
  updateBiometry: (id: string, patch: Partial<BiometryEntry>) => void;
  removeBiometry: (id: string) => void;

  // Activities
  activities: Activity[];
  addActivity: (input: Omit<Activity, "id" | "createdAt" | "completions" | "status"> & { status?: Activity["status"] }) => void;
  updateActivity: (id: string, patch: Partial<Activity>) => void;
  removeActivity: (id: string) => void;
  toggleActivityCompletion: (id: string, date: string) => void;

  // util
  resetAll: () => void;
  exportJSON: () => string;
  importJSON: (raw: string) => boolean;
}

const initialWorkoutTypes: WorkoutType[] = [
  { id: uid(), name: "Musculação", weeklyTarget: 4 },
  { id: uid(), name: "Corrida", weeklyTarget: 2 },
];

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      profile: { name: "", createdAt: nowISO() },
      setProfileName: (name) => set((s) => ({ profile: { ...s.profile, name } })),

      water: [],
      waterGoals: { defaultMl: 3000, overrides: {} },
      addWater: (amountMl, dateISO) =>
        set((s) => {
          let at = nowISO();
          if (dateISO && dateISO !== todayISO()) {
            // anchor to noon of the chosen day to avoid TZ off-by-one
            at = new Date(`${dateISO}T12:00:00`).toISOString();
          }
          return { water: [...s.water, { id: uid(), amountMl, at }] };
        }),
      updateWater: (id, patch) =>
        set((s) => ({
          water: s.water.map((w) => (w.id === id ? { ...w, ...patch } : w)),
        })),
      removeWater: (id) => set((s) => ({ water: s.water.filter((w) => w.id !== id) })),
      setWaterDefault: (ml) =>
        set((s) => ({ waterGoals: { ...s.waterGoals, defaultMl: ml } })),
      setWaterOverride: (day, ml) =>
        set((s) => {
          const overrides = { ...s.waterGoals.overrides };
          if (ml == null) delete overrides[day];
          else overrides[day] = ml;
          return { waterGoals: { ...s.waterGoals, overrides } };
        }),

      meals: [],
      addMeal: ({ name, tag, notes, dateISO }) => {
        let at = nowISO();
        if (dateISO && dateISO !== todayISO()) {
          at = new Date(`${dateISO}T12:00:00`).toISOString();
        }
        set((s) => ({ meals: [...s.meals, { id: uid(), name, tag, notes, at }] }));
      },
      updateMeal: (id, patch) =>
        set((s) => ({ meals: s.meals.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      removeMeal: (id) => set((s) => ({ meals: s.meals.filter((m) => m.id !== id) })),

      workoutTypes: initialWorkoutTypes,
      workoutLogs: [],
      addWorkoutType: ({ name, weeklyTarget }) =>
        set((s) => ({ workoutTypes: [...s.workoutTypes, { id: uid(), name, weeklyTarget }] })),
      updateWorkoutType: (id, patch) =>
        set((s) => ({
          workoutTypes: s.workoutTypes.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      removeWorkoutType: (id) =>
        set((s) => ({
          workoutTypes: s.workoutTypes.filter((t) => t.id !== id),
          workoutLogs: s.workoutLogs.filter((l) => l.typeId !== id),
        })),
      toggleWorkoutLog: (typeId, date, note) =>
        set((s) => {
          const existing = s.workoutLogs.find((l) => l.typeId === typeId && l.date === date);
          if (existing) {
            return {
              workoutLogs: s.workoutLogs.map((l) =>
                l.id === existing.id ? { ...l, done: !l.done, note: note ?? l.note } : l,
              ),
            };
          }
          return {
            workoutLogs: [
              ...s.workoutLogs,
              { id: uid(), typeId, date, done: true, note },
            ],
          };
        }),
      setWorkoutNote: (typeId, date, note) =>
        set((s) => {
          const existing = s.workoutLogs.find((l) => l.typeId === typeId && l.date === date);
          if (existing) {
            return {
              workoutLogs: s.workoutLogs.map((l) =>
                l.id === existing.id ? { ...l, note } : l,
              ),
            };
          }
          return {
            workoutLogs: [...s.workoutLogs, { id: uid(), typeId, date, done: false, note }],
          };
        }),

      biometry: [],
      addBiometry: (input) =>
        set((s) => ({
          biometry: [...s.biometry, { id: uid(), at: input.at ?? nowISO(), ...input }],
        })),
      updateBiometry: (id, patch) =>
        set((s) => ({ biometry: s.biometry.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
      removeBiometry: (id) => set((s) => ({ biometry: s.biometry.filter((b) => b.id !== id) })),

      activities: [],
      addActivity: (input) =>
        set((s) => ({
          activities: [
            ...s.activities,
            {
              id: uid(),
              createdAt: nowISO(),
              completions: [],
              status: input.status ?? "pending",
              ...input,
            },
          ],
        })),
      updateActivity: (id, patch) =>
        set((s) => ({ activities: s.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      removeActivity: (id) => set((s) => ({ activities: s.activities.filter((a) => a.id !== id) })),
      toggleActivityCompletion: (id, date) =>
        set((s) => ({
          activities: s.activities.map((a) => {
            if (a.id !== id) return a;
            const has = a.completions.includes(date);
            const completions = has ? a.completions.filter((d) => d !== date) : [...a.completions, date];
            const status: Activity["status"] =
              a.recurrence.kind === "none" ? (has ? "pending" : "done") : a.status;
            return { ...a, completions, status };
          }),
        })),

      resetAll: () =>
        set({
          profile: { name: get().profile.name, createdAt: nowISO() },
          water: [],
          waterGoals: { defaultMl: 3000, overrides: {} },
          meals: [],
          workoutTypes: initialWorkoutTypes,
          workoutLogs: [],
          biometry: [],
          activities: [],
        }),
      exportJSON: () => JSON.stringify(get(), null, 2),
      importJSON: (raw) => {
        try {
          const parsed = JSON.parse(raw);
          set((s) => ({ ...s, ...parsed }));
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: "omnitrack:v1",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : (undefined as never))),
      skipHydration: true,
    },
  ),
);

// Selectors / helpers (pure)
export const goalForDate = (g: WaterGoals, d: Date) => {
  const w = weekdayOf(d);
  return g.overrides[w] ?? g.defaultMl;
};

export const waterTotalForDate = (logs: WaterLog[], dateISO: string) =>
  logs
    .filter((l) => l.at.slice(0, 10) === dateISO)
    .reduce((sum, l) => sum + l.amountMl, 0);

export const mealsForDate = (meals: MealLog[], dateISO: string) =>
  meals.filter((m) => m.at.slice(0, 10) === dateISO);

export const dayNutritionScore = (meals: MealLog[]) => {
  if (meals.length === 0) return null;
  const weights: Record<MealTag, number> = { healthy: 1, neutral: 0.5, unhealthy: -0.5 };
  const score = meals.reduce((s, m) => s + weights[m.tag], 0) / meals.length;
  return Math.max(0, Math.min(1, (score + 0.5) / 1.5)); // 0..1
};

export const _todayISO = todayISO;
