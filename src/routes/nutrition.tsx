import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/glass-card";
import { dayNutritionScore, mealsForDate, useStore } from "@/lib/store";
import { todayISO, weekDates, toISO, weekdayLabel } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MealLog, MealTag, Weekday } from "@/lib/types";
import { EmptyState, PageHeader } from "./water";

export const Route = createFileRoute("/nutrition")({
  head: () => ({ meta: [{ title: "Nutrição — OmniTrack" }] }),
  component: NutritionPage,
});

const TAG_META: Record<MealTag, { label: string; cls: string; dot: string }> = {
  healthy: {
    label: "Saudável",
    cls: "border-primary/40 text-primary bg-primary/5",
    dot: "bg-primary shadow-[0_0_8px_var(--primary)]",
  },
  neutral: {
    label: "Neutro",
    cls: "border-border text-muted-foreground bg-muted/20",
    dot: "bg-muted-foreground",
  },
  unhealthy: {
    label: "Não saudável",
    cls: "border-destructive/40 text-destructive bg-destructive/5",
    dot: "bg-destructive shadow-[0_0_8px_var(--destructive)]",
  },
};

function NutritionPage() {
  const meals = useStore((s) => s.meals);
  const today = todayISO();
  const todayMeals = useMemo(
    () => mealsForDate(meals, today).sort((a, b) => b.at.localeCompare(a.at)),
    [meals, today],
  );
  const score = dayNutritionScore(todayMeals);

  const status =
    score == null
      ? { label: "Sem dados", cls: "text-muted-foreground" }
      : score >= 0.66
      ? { label: "No caminho", cls: "text-primary" }
      : score >= 0.4
      ? { label: "Atenção", cls: "text-warn" }
      : { label: "Fora do trilho", cls: "text-destructive" };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nutrição"
        subtitle="Log de impacto — disciplina sobre dieta."
        actions={<MealDialog />}
      />

      <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight">Hoje</h3>
            <span className={cn("text-xs font-semibold uppercase tracking-wider", status.cls)}>
              {status.label}
            </span>
          </div>
          <div className="mt-3">
            <div className="num text-4xl font-bold">
              {score == null ? "—" : `${Math.round(score * 100)}%`}
            </div>
            <div className="text-xs text-muted-foreground">aderência do dia</div>
          </div>
          <div className="mt-5 space-y-2">
            <TagBar
              label="Saudáveis"
              count={todayMeals.filter((m) => m.tag === "healthy").length}
              total={todayMeals.length}
              tone="primary"
            />
            <TagBar
              label="Neutras"
              count={todayMeals.filter((m) => m.tag === "neutral").length}
              total={todayMeals.length}
              tone="muted"
            />
            <TagBar
              label="Não saudáveis"
              count={todayMeals.filter((m) => m.tag === "unhealthy").length}
              total={todayMeals.length}
              tone="danger"
            />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="mb-4 text-sm font-semibold tracking-tight">Performance semanal</h3>
          <WeeklyNutrition />
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight">Timeline de hoje</h3>
          <span className="text-xs text-muted-foreground">{todayMeals.length} refeições</span>
        </div>
        {todayMeals.length === 0 ? (
          <EmptyState text="Nenhuma refeição registrada. Toque em + para adicionar a primeira." />
        ) : (
          <ul className="space-y-2">
            {todayMeals.map((m) => (
              <MealRow key={m.id} meal={m} />
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}

function TagBar({
  label,
  count,
  total,
  tone,
}: {
  label: string;
  count: number;
  total: number;
  tone: "primary" | "muted" | "danger";
}) {
  const pct = total ? (count / total) * 100 : 0;
  const bg = {
    primary: "bg-primary",
    muted: "bg-muted-foreground/60",
    danger: "bg-destructive",
  }[tone];
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="num">{count}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted/40">
        <div className={cn("h-full transition-all", bg)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function WeeklyNutrition() {
  const meals = useStore((s) => s.meals);
  const days = weekDates();
  const today = todayISO();
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d) => {
        const iso = toISO(d);
        const list = mealsForDate(meals, iso);
        const h = list.filter((m) => m.tag === "healthy").length;
        const n = list.filter((m) => m.tag === "neutral").length;
        const u = list.filter((m) => m.tag === "unhealthy").length;
        const tot = list.length || 1;
        return (
          <div key={iso} className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "flex h-28 w-full flex-col-reverse overflow-hidden rounded-lg border bg-card/40",
                iso === today ? "border-primary/60" : "border-border",
              )}
            >
              {list.length > 0 ? (
                <>
                  <div className="bg-destructive/80" style={{ height: `${(u / tot) * 100}%` }} />
                  <div className="bg-muted-foreground/40" style={{ height: `${(n / tot) * 100}%` }} />
                  <div className="bg-primary/80" style={{ height: `${(h / tot) * 100}%` }} />
                </>
              ) : null}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {weekdayLabel(d.getDay() as Weekday)}
            </div>
            <div className="num text-[10px] text-foreground/80">{list.length}</div>
          </div>
        );
      })}
    </div>
  );
}

function MealRow({ meal }: { meal: MealLog }) {
  const update = useStore((s) => s.updateMeal);
  const remove = useStore((s) => s.removeMeal);
  const meta = TAG_META[meal.tag];
  const [edit, setEdit] = useState(false);
  return (
    <li className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card/30 px-3 py-2.5">
      <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-medium">{meal.name}</div>
        <div className="text-xs text-muted-foreground">
          {new Date(meal.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          {meal.notes && ` · ${meal.notes}`}
        </div>
      </div>
      <span className={cn("hidden rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider md:inline", meta.cls)}>
        {meta.label}
      </span>
      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={() => setEdit(true)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => {
            if (confirm("Remover esta refeição?")) {
              remove(meal.id);
              toast("Refeição removida");
            }
          }}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <MealDialog
        open={edit}
        onOpenChange={setEdit}
        initial={meal}
        onSave={(patch) => {
          update(meal.id, patch);
          toast.success("Atualizada");
        }}
      />
    </li>
  );
}

function MealDialog({
  open: controlledOpen,
  onOpenChange,
  initial,
  onSave,
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  initial?: MealLog;
  onSave?: (patch: Partial<MealLog>) => void;
} = {}) {
  const add = useStore((s) => s.addMeal);
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen ?? localOpen;
  const setOpen = onOpenChange ?? setLocalOpen;

  const [name, setName] = useState(initial?.name ?? "");
  const [tag, setTag] = useState<MealTag | null>(initial?.tag ?? null);
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const submit = () => {
    if (!name || !tag) return;
    if (initial && onSave) onSave({ name, tag, notes: notes || undefined });
    else {
      add({ name, tag, notes: notes || undefined });
      toast.success("Refeição registrada");
    }
    setName(""); setTag(null); setNotes("");
    setOpen(false);
  };

  const trigger = !initial && (
    <DialogTrigger asChild>
      <Button size="sm">
        <Plus className="mr-1 h-4 w-4" /> Refeição
      </Button>
    </DialogTrigger>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Editar refeição" : "Nova refeição"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            autoFocus
            placeholder="Ex: Frango grelhado e batata doce"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(TAG_META) as MealTag[]).map((t) => {
              const m = TAG_META[t];
              return (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={cn(
                    "rounded-xl border bg-card/30 px-3 py-3 text-xs font-semibold transition-all",
                    m.cls,
                    tag === t && "ring-2 ring-offset-2 ring-offset-background ring-current",
                  )}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
          <Textarea
            placeholder="Notas (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
          <Button className="w-full" disabled={!name || !tag} onClick={submit}>
            {initial ? "Salvar" : "Registrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
