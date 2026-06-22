import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GlassCard } from "@/components/glass-card";
import { ProgressRing } from "@/components/progress-ring";
import { goalForDate, useStore, waterTotalForDate } from "@/lib/store";
import { todayISO, weekDates, toISO, weekdayLabel, weekdayLabelLong } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Weekday } from "@/lib/types";

export const Route = createFileRoute("/water")({
  head: () => ({
    meta: [{ title: "Hidratação — OmniTrack" }],
  }),
  component: WaterPage,
});

const QUICK = [200, 250, 500, 750, 1000];

function WaterPage() {
  const water = useStore((s) => s.water);
  const goals = useStore((s) => s.waterGoals);
  const addWater = useStore((s) => s.addWater);
  const removeWater = useStore((s) => s.removeWater);

  const today = todayISO();
  const total = waterTotalForDate(water, today);
  const goal = goalForDate(goals, new Date());
  const pct = goal ? total / goal : 0;

  const todayLogs = water
    .filter((w) => w.at.slice(0, 10) === today)
    .sort((a, b) => b.at.localeCompare(a.at));

  const days = weekDates();
  const weekData = days.map((d) => {
    const iso = toISO(d);
    const g = goalForDate(goals, d);
    const t = waterTotalForDate(water, iso);
    return { iso, day: d, goal: g, total: t, hit: t >= g };
  });
  const hits = weekData.filter((d) => d.hit).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hidratação"
        subtitle="Motor de água — meta dinâmica por dia."
        actions={<GoalDialog />}
      />

      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <GlassCard className="flex flex-col items-center justify-center gap-5 p-8">
          <ProgressRing
            value={pct}
            size={240}
            strokeWidth={18}
            indicatorClassName="stroke-cyan"
          >
            <div className="text-center">
              <div className="num text-5xl font-bold neon-cyan">{total}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                de {goal} ml · {Math.round(pct * 100)}%
              </div>
            </div>
          </ProgressRing>

          <div className="flex w-full flex-wrap items-center justify-center gap-2">
            {QUICK.map((ml) => (
              <button
                key={ml}
                onClick={() => {
                  addWater(ml);
                  toast.success(`+${ml}ml`);
                }}
                className="rounded-full border border-border bg-card/40 px-4 py-2 text-sm font-semibold transition-all hover:border-cyan hover:text-cyan hover:shadow-[0_0_20px_-6px_var(--cyan)]"
              >
                +{ml}
              </button>
            ))}
            <CustomAdd onAdd={(ml) => { addWater(ml); toast.success(`+${ml}ml`); }} />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <h3 className="text-sm font-semibold tracking-tight">Semana</h3>
            <span className="text-xs text-muted-foreground">
              <span className="num text-foreground">{hits}</span>/7 dias na meta
            </span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekData.map((d) => {
              const p = Math.min(1, d.total / d.goal);
              const isToday = d.iso === today;
              return (
                <div key={d.iso} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`relative h-28 w-full overflow-hidden rounded-lg border ${
                      isToday ? "border-primary/60" : "border-border"
                    } bg-card/40`}
                  >
                    <div
                      className="absolute inset-x-0 bottom-0 transition-all"
                      style={{
                        height: `${p * 100}%`,
                        background:
                          "linear-gradient(180deg, color-mix(in oklab, var(--cyan) 90%, transparent), color-mix(in oklab, var(--primary) 70%, transparent))",
                      }}
                    />
                    {d.hit && (
                      <div className="absolute inset-x-0 top-1 text-center text-[10px] font-bold text-gold">★</div>
                    )}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {weekdayLabel(d.day.getDay() as Weekday)}
                  </div>
                  <div className="num text-[10px] text-foreground/80">{d.total}</div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Aderência semanal: <span className="num text-foreground">{Math.round((hits / 7) * 100)}%</span>
          </p>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight">Log de hoje</h3>
          <span className="text-xs text-muted-foreground">{todayLogs.length} entradas</span>
        </div>
        {todayLogs.length === 0 ? (
          <EmptyState text="Nenhum registro hoje. Use o botão + para começar." />
        ) : (
          <ul className="divide-y divide-border/60">
            {todayLogs.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_8px_var(--cyan)]" />
                  <span className="num text-sm font-semibold">+{l.amountMl} ml</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(l.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Remover este registro?")) {
                      removeWater(l.id);
                      toast("Registro removido");
                    }
                  }}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}

function CustomAdd({ onAdd }: { onAdd: (ml: number) => void }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="rounded-full border border-dashed border-border bg-transparent px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-cyan hover:text-cyan">
          <Plus className="mr-1 inline h-3.5 w-3.5" /> Outro
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quantidade personalizada</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            autoFocus
            inputMode="numeric"
            placeholder="ml"
            value={val}
            onChange={(e) => setVal(e.target.value.replace(/\D/g, ""))}
          />
          <Button
            disabled={!val}
            onClick={() => {
              onAdd(Number(val));
              setVal("");
              setOpen(false);
            }}
          >
            Adicionar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GoalDialog() {
  const goals = useStore((s) => s.waterGoals);
  const setDefault = useStore((s) => s.setWaterDefault);
  const setOverride = useStore((s) => s.setWaterOverride);
  const [open, setOpen] = useState(false);
  const [def, setDef] = useState(String(goals.defaultMl));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="mr-1.5 h-3.5 w-3.5" /> Meta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Meta de hidratação</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div>
            <Label className="text-xs">Meta padrão diária (ml)</Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                inputMode="numeric"
                value={def}
                onChange={(e) => setDef(e.target.value.replace(/\D/g, ""))}
              />
              <Button
                onClick={() => {
                  setDefault(Number(def) || 0);
                  toast.success("Meta padrão atualizada");
                }}
              >
                Salvar
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Overrides por dia da semana</Label>
            <div className="space-y-1.5">
              {([1, 2, 3, 4, 5, 6, 0] as Weekday[]).map((w) => (
                <div key={w} className="flex items-center gap-2 text-sm">
                  <span className="w-24 text-muted-foreground">{weekdayLabelLong(w)}</span>
                  <Input
                    inputMode="numeric"
                    placeholder={`${goals.defaultMl}`}
                    value={goals.overrides[w] ?? ""}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      setOverride(w, v ? Number(v) : null);
                    }}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Deixe vazio para usar o padrão.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </header>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border/60 py-10 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
