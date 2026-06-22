import { useState } from "react";
import { Droplets, UtensilsCrossed, Dumbbell, Activity, Plus, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { GlassCard } from "./glass-card";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { MealTag } from "@/lib/types";

type Mode = null | "water" | "meal" | "workout" | "activity";

export function QuickAddFab() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>(null);

  const addWater = useStore((s) => s.addWater);
  const addMeal = useStore((s) => s.addMeal);
  const workoutTypes = useStore((s) => s.workoutTypes);
  const toggleWorkoutLog = useStore((s) => s.toggleWorkoutLog);
  const addActivity = useStore((s) => s.addActivity);

  const close = () => {
    setOpen(false);
    setMode(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Quick add"
        className={cn(
          "fixed bottom-24 right-5 z-40 grid h-14 w-14 place-items-center rounded-full md:bottom-8 md:right-8",
          "gold-3d text-[oklch(0.2_0.05_70)] transition-transform active:scale-95",
          open && "rotate-45",
        )}
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm"
          onClick={close}
        />
      )}

      {open && (
        <div className="fixed bottom-44 right-5 z-40 flex flex-col items-end gap-3 md:bottom-28 md:right-8">
          {!mode && (
            <div className="flex flex-col items-end gap-2">
              <FabItem
                icon={<Droplets className="h-5 w-5 text-cyan" />}
                label="Água"
                onClick={() => setMode("water")}
              />
              <FabItem
                icon={<UtensilsCrossed className="h-5 w-5 text-primary" />}
                label="Refeição"
                onClick={() => setMode("meal")}
              />
              <FabItem
                icon={<Dumbbell className="h-5 w-5 text-gold" />}
                label="Treino"
                onClick={() => setMode("workout")}
              />
              <FabItem
                icon={<Activity className="h-5 w-5 text-foreground" />}
                label="Atividade"
                onClick={() => setMode("activity")}
              />
            </div>
          )}

          {mode && (
            <GlassCard variant="strong" className="w-[min(92vw,360px)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold tracking-tight">
                  {mode === "water" && "Adicionar Água"}
                  {mode === "meal" && "Registrar Refeição"}
                  {mode === "workout" && "Marcar Treino"}
                  {mode === "activity" && "Nova Atividade"}
                </h3>
                <button onClick={() => setMode(null)} className="rounded-md p-1 hover:bg-muted/50">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {mode === "water" && (
                <WaterQuick
                  onDone={(ml) => {
                    addWater(ml);
                    toast.success(`+${ml}ml registrados`);
                    close();
                  }}
                />
              )}
              {mode === "meal" && (
                <MealQuick
                  onDone={(name, tag) => {
                    addMeal({ name, tag });
                    toast.success("Refeição registrada");
                    close();
                  }}
                />
              )}
              {mode === "workout" && (
                <WorkoutQuick
                  types={workoutTypes}
                  onDone={(typeId) => {
                    const today = new Date().toISOString().slice(0, 10);
                    toggleWorkoutLog(typeId, today);
                    toast.success("Treino marcado");
                    close();
                  }}
                />
              )}
              {mode === "activity" && (
                <ActivityQuick
                  onDone={(title) => {
                    addActivity({ title, recurrence: { kind: "none" } });
                    toast.success("Atividade criada");
                    close();
                  }}
                />
              )}
            </GlassCard>
          )}
        </div>
      )}
    </>
  );
}

function FabItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="glass-strong flex items-center gap-3 rounded-full py-2 pl-3 pr-4 text-sm font-medium shadow-elevated transition-transform hover:scale-[1.02]"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function WaterQuick({ onDone }: { onDone: (ml: number) => void }) {
  const [custom, setCustom] = useState("");
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {[200, 250, 500, 750].map((ml) => (
          <button
            key={ml}
            onClick={() => onDone(ml)}
            className="rounded-xl border border-border bg-card/40 py-3 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
          >
            +{ml}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          inputMode="numeric"
          placeholder="ml"
          value={custom}
          onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))}
        />
        <Button
          disabled={!custom}
          onClick={() => {
            const n = Number(custom);
            if (n > 0) onDone(n);
          }}
        >
          Adicionar
        </Button>
      </div>
    </div>
  );
}

function MealQuick({ onDone }: { onDone: (name: string, tag: MealTag) => void }) {
  const [name, setName] = useState("");
  return (
    <div className="space-y-3">
      <Input placeholder="Ex: Frango grelhado e arroz" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="grid grid-cols-3 gap-2">
        <TagBtn label="Saudável" color="primary" onClick={() => name && onDone(name, "healthy")} />
        <TagBtn label="Neutro" color="muted" onClick={() => name && onDone(name, "neutral")} />
        <TagBtn label="Não saudável" color="danger" onClick={() => name && onDone(name, "unhealthy")} />
      </div>
    </div>
  );
}

function TagBtn({
  label,
  color,
  onClick,
}: {
  label: string;
  color: "primary" | "muted" | "danger";
  onClick: () => void;
}) {
  const cls = {
    primary: "border-primary/40 text-primary hover:bg-primary/10",
    muted: "border-border text-foreground hover:bg-muted/40",
    danger: "border-destructive/50 text-destructive hover:bg-destructive/10",
  }[color];
  return (
    <button
      onClick={onClick}
      className={cn("rounded-xl border bg-card/30 py-2.5 text-xs font-semibold transition-colors", cls)}
    >
      {label}
    </button>
  );
}

function WorkoutQuick({
  types,
  onDone,
}: {
  types: { id: string; name: string }[];
  onDone: (id: string) => void;
}) {
  if (types.length === 0)
    return <p className="text-xs text-muted-foreground">Cadastre uma modalidade primeiro na aba Físico.</p>;
  return (
    <div className="grid gap-2">
      {types.map((t) => (
        <button
          key={t.id}
          onClick={() => onDone(t.id)}
          className="rounded-xl border border-border bg-card/40 px-4 py-3 text-left text-sm font-medium transition-colors hover:border-gold hover:text-gold"
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}

function ActivityQuick({ onDone }: { onDone: (title: string) => void }) {
  const [title, setTitle] = useState("");
  return (
    <div className="space-y-3">
      <Input placeholder="Título da atividade" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Button className="w-full" disabled={!title} onClick={() => onDone(title)}>
        Criar
      </Button>
    </div>
  );
}
