import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/glass-card";
import { useStore } from "@/lib/store";
import { todayISO, weekdayLabelLong } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Activity, Weekday } from "@/lib/types";
import { EmptyState, PageHeader } from "./water";

export const Route = createFileRoute("/activities")({
  head: () => ({ meta: [{ title: "Atividades — OmniTrack" }] }),
  component: ActivitiesPage,
});

function ActivitiesPage() {
  const activities = useStore((s) => s.activities);
  const today = todayISO();
  const todayWeekday = new Date().getDay() as Weekday;

  const { todayList, others } = useMemo(() => {
    const todayList: Activity[] = [];
    const others: Activity[] = [];
    activities.forEach((a) => {
      if (a.recurrence.kind === "daily") todayList.push(a);
      else if (a.recurrence.kind === "weekdays" && a.recurrence.days.includes(todayWeekday))
        todayList.push(a);
      else if (a.recurrence.kind === "none" && a.status !== "done") todayList.push(a);
      else others.push(a);
    });
    return { todayList, others };
  }, [activities, todayWeekday]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Atividades"
        subtitle="Rotinas e tarefas paralelas."
        actions={<ActivityDialog />}
      />

      <GlassCard className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight">Hoje</h3>
          <span className="text-xs text-muted-foreground">{todayList.length} previstas</span>
        </div>
        {todayList.length === 0 ? (
          <EmptyState text="Nada previsto pra hoje. Aproveite para criar uma rotina." />
        ) : (
          <ul className="space-y-1.5">
            {todayList.map((a) => (
              <ActivityRow key={a.id} activity={a} dateISO={today} />
            ))}
          </ul>
        )}
      </GlassCard>

      {others.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="mb-3 text-sm font-semibold tracking-tight">Outras</h3>
          <ul className="space-y-1.5">
            {others.map((a) => (
              <ActivityRow key={a.id} activity={a} dateISO={today} />
            ))}
          </ul>
        </GlassCard>
      )}
    </div>
  );
}

function ActivityRow({ activity, dateISO }: { activity: Activity; dateISO: string }) {
  const toggle = useStore((s) => s.toggleActivityCompletion);
  const remove = useStore((s) => s.removeActivity);
  const update = useStore((s) => s.updateActivity);
  const [edit, setEdit] = useState(false);

  const isRecurring = activity.recurrence.kind !== "none";
  const done = isRecurring
    ? activity.completions.includes(dateISO)
    : activity.status === "done";

  const recurrenceLabel =
    activity.recurrence.kind === "none"
      ? "Pontual"
      : activity.recurrence.kind === "daily"
      ? "Diário"
      : activity.recurrence.days.map((d) => weekdayLabelLong(d).slice(0, 3)).join(", ");

  return (
    <li
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-border/60 bg-card/30 px-3 py-2.5 transition-all",
        done && "bg-primary/5",
      )}
    >
      <Checkbox
        checked={done}
        onCheckedChange={() => {
          if (isRecurring) toggle(activity.id, dateISO);
          else update(activity.id, { status: done ? "pending" : "done" });
        }}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <div className="flex-1 min-w-0">
        <div className={cn("truncate text-sm font-medium", done && "text-muted-foreground line-through")}>
          {activity.title}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          <span className="rounded-full border border-border bg-card/40 px-1.5 py-0.5 uppercase tracking-wider">
            {recurrenceLabel}
          </span>
          {activity.dueAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(activity.dueAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
            </span>
          )}
          {activity.description && <span className="truncate">· {activity.description}</span>}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={() => setEdit(true)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => {
            if (confirm(`Remover "${activity.title}"?`)) {
              remove(activity.id);
              toast("Atividade removida");
            }
          }}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <ActivityDialog open={edit} onOpenChange={setEdit} initial={activity} />
    </li>
  );
}

function ActivityDialog({
  open: controlled,
  onOpenChange,
  initial,
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  initial?: Activity;
} = {}) {
  const add = useStore((s) => s.addActivity);
  const update = useStore((s) => s.updateActivity);
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlled ?? localOpen;
  const setOpen = onOpenChange ?? setLocalOpen;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [recurrenceKind, setRecurrenceKind] = useState<"none" | "daily" | "weekdays">(
    initial?.recurrence.kind ?? "none",
  );
  const [days, setDays] = useState<Weekday[]>(
    initial?.recurrence.kind === "weekdays" ? initial.recurrence.days : [],
  );
  const [dueAt, setDueAt] = useState(initial?.dueAt?.slice(0, 16) ?? "");

  const submit = () => {
    if (!title) return;
    const recurrence: Activity["recurrence"] =
      recurrenceKind === "daily"
        ? { kind: "daily" }
        : recurrenceKind === "weekdays"
        ? { kind: "weekdays", days }
        : { kind: "none" };
    const payload = {
      title,
      description: description || undefined,
      recurrence,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
    };
    if (initial) {
      update(initial.id, payload);
      toast.success("Atualizada");
    } else {
      add(payload);
      toast.success("Atividade criada");
    }
    setOpen(false);
    if (!initial) {
      setTitle(""); setDescription(""); setDueAt(""); setRecurrenceKind("none"); setDays([]);
    }
  };

  const trigger = !initial && (
    <DialogTrigger asChild>
      <Button size="sm">
        <Plus className="mr-1 h-4 w-4" /> Atividade
      </Button>
    </DialogTrigger>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar atividade" : "Nova atividade"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Título</Label>
            <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Recorrência</Label>
            <div className="mt-1 grid grid-cols-3 gap-1.5">
              {(["none", "daily", "weekdays"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setRecurrenceKind(k)}
                  className={cn(
                    "rounded-lg border bg-card/40 px-2 py-2 text-xs font-medium transition-colors",
                    recurrenceKind === k
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {k === "none" ? "Pontual" : k === "daily" ? "Diária" : "Dias específicos"}
                </button>
              ))}
            </div>
          </div>
          {recurrenceKind === "weekdays" && (
            <div className="flex flex-wrap gap-1.5">
              {([1, 2, 3, 4, 5, 6, 0] as Weekday[]).map((w) => {
                const on = days.includes(w);
                return (
                  <button
                    key={w}
                    onClick={() => setDays((prev) => (on ? prev.filter((d) => d !== w) : [...prev, w]))}
                    className={cn(
                      "h-9 w-12 rounded-lg border text-xs font-semibold transition-colors",
                      on
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {weekdayLabelLong(w).slice(0, 3)}
                  </button>
                );
              })}
            </div>
          )}
          <div>
            <Label className="text-xs">Alerta / prazo</Label>
            <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </div>
          <Button className="w-full" disabled={!title} onClick={submit}>
            {initial ? "Salvar" : "Criar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
