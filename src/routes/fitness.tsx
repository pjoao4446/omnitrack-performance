import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/glass-card";
import { useStore } from "@/lib/store";
import { weekDates, toISO, weekdayLabel, todayISO } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { BiometryEntry, Weekday, WorkoutType } from "@/lib/types";
import { EmptyState, PageHeader } from "./water";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/fitness")({
  head: () => ({ meta: [{ title: "Físico — OmniTrack" }] }),
  component: FitnessPage,
});

function FitnessPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Físico" subtitle="Treinos, frequência e biometria." />
      <Tabs defaultValue="workouts">
        <TabsList className="bg-card/40">
          <TabsTrigger value="workouts">Treinos</TabsTrigger>
          <TabsTrigger value="biometry">Biometria</TabsTrigger>
        </TabsList>
        <TabsContent value="workouts" className="mt-4">
          <WorkoutsView />
        </TabsContent>
        <TabsContent value="biometry" className="mt-4">
          <BiometryView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WorkoutsView() {
  const types = useStore((s) => s.workoutTypes);
  const logs = useStore((s) => s.workoutLogs);
  const toggle = useStore((s) => s.toggleWorkoutLog);
  const setNote = useStore((s) => s.setWorkoutNote);

  const days = useMemo(() => weekDates(), []);
  const today = todayISO();

  const totalTarget = types.reduce((s, t) => s + t.weeklyTarget, 0);
  const totalDone = logs.filter((l) => l.done && days.some((d) => toISO(d) === l.date)).length;

  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Frequência da semana
            </div>
            <div className="mt-1 num text-3xl font-bold">
              {totalDone}
              <span className="text-base text-muted-foreground">/{totalTarget}</span>
            </div>
          </div>
          <WorkoutTypeDialog />
        </div>
      </GlassCard>

      {types.length === 0 && (
        <EmptyState text="Cadastre sua primeira modalidade para começar." />
      )}

      {types.map((t) => {
        const weekLogs = days.map((d) => {
          const iso = toISO(d);
          const l = logs.find((x) => x.typeId === t.id && x.date === iso);
          return { iso, day: d, log: l };
        });
        const done = weekLogs.filter((w) => w.log?.done).length;
        return (
          <GlassCard key={t.id} className="p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg border border-gold/30 bg-gold/10 text-sm font-bold text-gold">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="num text-foreground">{done}</span>/{t.weeklyTarget} esta semana
                  </div>
                </div>
              </div>
              <WorkoutTypeDialog initial={t} />
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekLogs.map(({ iso, day, log }) => {
                const isToday = iso === today;
                const isDone = log?.done;
                return (
                  <button
                    key={iso}
                    onClick={() => toggle(t.id, iso)}
                    className={cn(
                      "group flex flex-col items-center gap-1 rounded-lg border bg-card/30 py-2.5 transition-all",
                      isDone
                        ? "border-gold/60 bg-gold/10 text-gold shadow-[0_0_18px_-6px_var(--gold)]"
                        : "border-border text-muted-foreground hover:border-gold/40 hover:text-foreground",
                      isToday && !isDone && "ring-1 ring-primary/40",
                    )}
                  >
                    <span className="text-[10px] uppercase tracking-wider">
                      {weekdayLabel(day.getDay() as Weekday)}
                    </span>
                    <span className="num text-sm font-bold">{day.getDate()}</span>
                    {isDone && <Check className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-3">
              <NoteRow
                value={logs.find((l) => l.typeId === t.id && l.date === today)?.note ?? ""}
                onChange={(v) => setNote(t.id, today, v)}
              />
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

function NoteRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <div className="flex gap-2">
      <Input
        placeholder="O que você fez hoje? (séries, distância, sensação)"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => v !== value && onChange(v)}
      />
    </div>
  );
}

function WorkoutTypeDialog({ initial }: { initial?: WorkoutType } = {}) {
  const [open, setOpen] = useState(false);
  const add = useStore((s) => s.addWorkoutType);
  const update = useStore((s) => s.updateWorkoutType);
  const remove = useStore((s) => s.removeWorkoutType);
  const [name, setName] = useState(initial?.name ?? "");
  const [target, setTarget] = useState(String(initial?.weeklyTarget ?? 3));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {initial ? (
          <Button variant="ghost" size="sm">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" /> Modalidade
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Editar modalidade" : "Nova modalidade"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Nome</Label>
            <Input
              autoFocus
              placeholder="Ex: Tênis"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Meta semanal</Label>
            <Input
              inputMode="numeric"
              value={target}
              onChange={(e) => setTarget(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={!name || !target}
              onClick={() => {
                if (initial) {
                  update(initial.id, { name, weeklyTarget: Number(target) });
                  toast.success("Atualizado");
                } else {
                  add({ name, weeklyTarget: Number(target) });
                  toast.success("Adicionado");
                }
                setName(""); setTarget("3");
                setOpen(false);
              }}
            >
              Salvar
            </Button>
            {initial && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm(`Remover ${initial.name} e seus registros?`)) {
                    remove(initial.id);
                    setOpen(false);
                    toast("Modalidade removida");
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BiometryView() {
  const biometry = useStore((s) => s.biometry);
  const remove = useStore((s) => s.removeBiometry);
  const sorted = useMemo(
    () => [...biometry].sort((a, b) => a.at.localeCompare(b.at)),
    [biometry],
  );

  const chartData = sorted
    .filter((b) => b.weightKg != null)
    .map((b) => ({
      date: new Date(b.at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      Peso: b.weightKg,
      Cintura: b.waistCm,
    }));

  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight">Evolução</h3>
          <BiometryDialog />
        </div>
        <div className="mt-4 h-64">
          {chartData.length < 2 ? (
            <EmptyState text="Registre ao menos 2 medições para ver o gráfico." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="date" stroke="oklch(0.7 0.015 252)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.015 252)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.2 0.025 250)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Peso"
                  stroke="oklch(0.84 0.16 175)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "oklch(0.84 0.16 175)" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Cintura"
                  stroke="oklch(0.82 0.14 86)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <h3 className="mb-4 text-sm font-semibold tracking-tight">Histórico</h3>
        {sorted.length === 0 ? (
          <EmptyState text="Nenhuma medição registrada." />
        ) : (
          <ul className="divide-y divide-border/60">
            {[...sorted].reverse().map((b) => (
              <li key={b.id} className="flex items-center justify-between py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">
                    {new Date(b.at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    {b.weightKg != null && <span><span className="num text-foreground">{b.weightKg}</span> kg</span>}
                    {b.waistCm != null && <span>Cintura <span className="num text-foreground">{b.waistCm}</span> cm</span>}
                    {b.chestCm != null && <span>Tórax <span className="num text-foreground">{b.chestCm}</span> cm</span>}
                    {b.hipCm != null && <span>Quadril <span className="num text-foreground">{b.hipCm}</span> cm</span>}
                    {b.armCm != null && <span>Braço <span className="num text-foreground">{b.armCm}</span> cm</span>}
                    {b.thighCm != null && <span>Coxa <span className="num text-foreground">{b.thighCm}</span> cm</span>}
                    {b.bodyFatPct != null && <span>BF <span className="num text-foreground">{b.bodyFatPct}</span>%</span>}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Remover esta medição?")) {
                      remove(b.id);
                      toast("Removida");
                    }
                  }}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}

function BiometryDialog() {
  const add = useStore((s) => s.addBiometry);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Partial<BiometryEntry>>({});

  const set = (k: keyof BiometryEntry) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setData((d) => ({ ...d, [k]: v === "" ? undefined : Number(v) }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" /> Medição
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova medição</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Peso (kg)" onChange={set("weightKg")} step="0.1" />
          <Field label="Altura (cm)" onChange={set("heightCm")} />
          <Field label="Cintura (cm)" onChange={set("waistCm")} step="0.1" />
          <Field label="Tórax (cm)" onChange={set("chestCm")} step="0.1" />
          <Field label="Quadril (cm)" onChange={set("hipCm")} step="0.1" />
          <Field label="Braço (cm)" onChange={set("armCm")} step="0.1" />
          <Field label="Coxa (cm)" onChange={set("thighCm")} step="0.1" />
          <Field label="% Gordura" onChange={set("bodyFatPct")} step="0.1" />
        </div>
        <Button
          className="w-full"
          disabled={Object.values(data).every((v) => v == null)}
          onClick={() => {
            add(data as Omit<BiometryEntry, "id" | "at">);
            toast.success("Medição registrada");
            setData({});
            setOpen(false);
          }}
        >
          Salvar
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, onChange, step }: { label: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; step?: string }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type="number" inputMode="decimal" step={step ?? "1"} onChange={onChange} />
    </div>
  );
}
