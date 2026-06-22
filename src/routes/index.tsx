import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  goalForDate,
  mealsForDate,
  useStore,
  waterTotalForDate,
  dayNutritionScore,
} from "@/lib/store";
import { todayISO, weekDates, toISO, weekdayLabel, weekdayOf } from "@/lib/date";
import { GlassCard } from "@/components/glass-card";
import { ProgressRing } from "@/components/progress-ring";
import { ArrowRight, Droplets, Dumbbell, UtensilsCrossed, Activity, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Daily Pulse — OmniTrack" },
      { name: "description", content: "Painel diário de performance pessoal." },
    ],
  }),
  component: DailyPulse,
});

function DailyPulse() {
  const today = todayISO();
  const profile = useStore((s) => s.profile);
  const water = useStore((s) => s.water);
  const waterGoals = useStore((s) => s.waterGoals);
  const meals = useStore((s) => s.meals);
  const workoutTypes = useStore((s) => s.workoutTypes);
  const workoutLogs = useStore((s) => s.workoutLogs);
  const activities = useStore((s) => s.activities);

  const waterToday = waterTotalForDate(water, today);
  const waterGoal = goalForDate(waterGoals, new Date());
  const waterPct = waterGoal ? waterToday / waterGoal : 0;

  const mealsToday = mealsForDate(meals, today);
  const nutritionScore = dayNutritionScore(mealsToday);

  const weekISO = useMemo(() => weekDates().map(toISO), []);
  const { trainedThisWeek, weeklyTarget } = useMemo(() => {
    const total = workoutTypes.reduce((sum, t) => sum + t.weeklyTarget, 0);
    const done = workoutLogs.filter(
      (l) => l.done && weekISO.includes(l.date),
    ).length;
    return { trainedThisWeek: done, weeklyTarget: total };
  }, [workoutLogs, workoutTypes, weekISO]);

  const activitiesToday = useMemo(() => {
    const w = weekdayOf(new Date());
    return activities.filter((a) => {
      if (a.recurrence.kind === "daily") return true;
      if (a.recurrence.kind === "weekdays") return a.recurrence.days.includes(w);
      return a.status !== "done";
    });
  }, [activities]);
  const activitiesDone = activitiesToday.filter((a) =>
    a.recurrence.kind === "none" ? a.status === "done" : a.completions.includes(today),
  ).length;

  const allOnTrack =
    waterPct >= 1 &&
    (nutritionScore ?? 0) >= 0.66 &&
    trainedThisWeek >= weeklyTarget &&
    activitiesToday.length > 0 &&
    activitiesDone === activitiesToday.length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
            {profile.name ? `Olá, ${profile.name.split(" ")[0]}` : "Daily Pulse"}
          </h1>
        </div>
        {allOnTrack && (
          <div className="flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold">
            <Sparkles className="h-3.5 w-3.5" /> Dia perfeito
          </div>
        )}
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PulseCard
          to="/water"
          title="Hidratação"
          icon={<Droplets className="h-4 w-4 text-cyan" />}
          accent="cyan"
        >
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <div className="num text-3xl font-bold">{waterToday}</div>
              <div className="text-xs text-muted-foreground">de {waterGoal} ml</div>
            </div>
            <ProgressRing
              value={waterPct}
              size={84}
              strokeWidth={8}
              indicatorClassName="stroke-cyan"
            >
              <span className="num text-sm font-semibold">{Math.round(waterPct * 100)}%</span>
            </ProgressRing>
          </div>
        </PulseCard>

        <PulseCard
          to="/nutrition"
          title="Nutrição"
          icon={<UtensilsCrossed className="h-4 w-4 text-primary" />}
          accent="primary"
        >
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <div className="num text-3xl font-bold">{mealsToday.length}</div>
              <div className="text-xs text-muted-foreground">refeições hoje</div>
            </div>
            <ProgressRing
              value={nutritionScore ?? 0}
              size={84}
              strokeWidth={8}
              indicatorClassName={cn(
                (nutritionScore ?? 0) >= 0.66
                  ? "stroke-primary"
                  : (nutritionScore ?? 0) >= 0.4
                  ? "stroke-warn"
                  : "stroke-danger",
              )}
            >
              <span className="num text-sm font-semibold">
                {nutritionScore == null ? "—" : `${Math.round(nutritionScore * 100)}%`}
              </span>
            </ProgressRing>
          </div>
          <div className="mt-3 flex gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
            <Pill label={`${mealsToday.filter((m) => m.tag === "healthy").length} saudável`} tone="primary" />
            <Pill label={`${mealsToday.filter((m) => m.tag === "neutral").length} neutra`} tone="muted" />
            <Pill label={`${mealsToday.filter((m) => m.tag === "unhealthy").length} ruim`} tone="danger" />
          </div>
        </PulseCard>

        <PulseCard
          to="/fitness"
          title="Treinos"
          icon={<Dumbbell className="h-4 w-4 text-gold" />}
          accent="gold"
        >
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <div className="num text-3xl font-bold">
                {trainedThisWeek}
                <span className="text-base text-muted-foreground">/{weeklyTarget || 0}</span>
              </div>
              <div className="text-xs text-muted-foreground">treinos na semana</div>
            </div>
            <ProgressRing
              value={weeklyTarget ? trainedThisWeek / weeklyTarget : 0}
              size={84}
              strokeWidth={8}
              indicatorClassName="stroke-gold"
            >
              <span className="num text-sm font-semibold">
                {weeklyTarget ? Math.round((trainedThisWeek / weeklyTarget) * 100) : 0}%
              </span>
            </ProgressRing>
          </div>
        </PulseCard>

        <PulseCard
          to="/activities"
          title="Atividades"
          icon={<Activity className="h-4 w-4 text-foreground" />}
          accent="default"
        >
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <div className="num text-3xl font-bold">
                {activitiesDone}
                <span className="text-base text-muted-foreground">/{activitiesToday.length}</span>
              </div>
              <div className="text-xs text-muted-foreground">previstas hoje</div>
            </div>
            <ProgressRing
              value={activitiesToday.length ? activitiesDone / activitiesToday.length : 0}
              size={84}
              strokeWidth={8}
              indicatorClassName="stroke-foreground"
            >
              <span className="num text-sm font-semibold">
                {activitiesToday.length
                  ? Math.round((activitiesDone / activitiesToday.length) * 100)
                  : 0}
                %
              </span>
            </ProgressRing>
          </div>
        </PulseCard>
      </div>

      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Semana em foco</h2>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Hidratação por dia
          </span>
        </div>
        <WeekHeatmap />
      </GlassCard>
    </div>
  );
}

function PulseCard({
  to,
  title,
  icon,
  accent,
  children,
}: {
  to: string;
  title: string;
  icon: React.ReactNode;
  accent: "cyan" | "primary" | "gold" | "default";
  children: React.ReactNode;
}) {
  const ring = {
    cyan: "hover:shadow-[0_0_30px_-8px_var(--cyan)]",
    primary: "hover:shadow-[0_0_30px_-8px_var(--primary)]",
    gold: "hover:shadow-[0_0_30px_-8px_var(--gold)]",
    default: "hover:shadow-[0_0_30px_-8px_oklch(1_0_0/0.4)]",
  }[accent];
  return (
    <Link to={to} className="group">
      <GlassCard className={cn("p-5 transition-all", ring)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {icon}
            {title}
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
        </div>
        {children}
      </GlassCard>
    </Link>
  );
}

function Pill({ label, tone }: { label: string; tone: "primary" | "muted" | "danger" }) {
  const cls = {
    primary: "border-primary/30 text-primary/90 bg-primary/5",
    muted: "border-border text-muted-foreground bg-muted/30",
    danger: "border-destructive/30 text-destructive/90 bg-destructive/5",
  }[tone];
  return (
    <span className={cn("rounded-full border px-2 py-0.5", cls)}>{label}</span>
  );
}

function WeekHeatmap() {
  const water = useStore((s) => s.water);
  const goals = useStore((s) => s.waterGoals);
  const days = weekDates();
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d) => {
        const iso = toISO(d);
        const total = waterTotalForDate(water, iso);
        const goal = goalForDate(goals, d);
        const pct = goal ? Math.min(1, total / goal) : 0;
        const isToday = iso === todayISO();
        return (
          <div key={iso} className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "relative h-20 w-full overflow-hidden rounded-lg border border-border bg-card/40",
                isToday && "ring-1 ring-primary/60",
              )}
            >
              <div
                className="absolute inset-x-0 bottom-0 transition-all duration-700"
                style={{
                  height: `${pct * 100}%`,
                  background:
                    "linear-gradient(180deg, color-mix(in oklab, var(--cyan) 80%, transparent), color-mix(in oklab, var(--primary) 70%, transparent))",
                  boxShadow: "0 0 18px color-mix(in oklab, var(--cyan) 50%, transparent)",
                }}
              />
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {weekdayLabel(d.getDay() as 0)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
