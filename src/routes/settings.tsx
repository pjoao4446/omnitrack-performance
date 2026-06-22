import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GlassCard } from "@/components/glass-card";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload, RotateCcw, User } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "./water";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configurações — OmniTrack" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const profile = useStore((s) => s.profile);
  const setProfileName = useStore((s) => s.setProfileName);
  const exportJSON = useStore((s) => s.exportJSON);
  const importJSON = useStore((s) => s.importJSON);
  const resetAll = useStore((s) => s.resetAll);
  const [name, setName] = useState(profile.name);

  const handleExport = () => {
    const blob = new Blob([exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `omnitrack-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Dados exportados");
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importJSON(String(reader.result));
      if (ok) toast.success("Dados importados");
      else toast.error("JSON inválido");
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" subtitle="Perfil, dados e preferências." />

      <GlassCard className="p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <User className="h-4 w-4 text-primary" /> Perfil
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-xs">Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
          </div>
          <Button
            className="self-end"
            onClick={() => {
              setProfileName(name);
              toast.success("Perfil atualizado");
            }}
          >
            Salvar
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="mb-3 text-sm font-semibold">Dados</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-1.5 h-4 w-4" /> Exportar JSON
          </Button>
          <label className="inline-flex">
            <Button variant="outline" asChild>
              <span className="cursor-pointer">
                <Upload className="mr-1.5 h-4 w-4" /> Importar JSON
              </span>
            </Button>
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
              }}
            />
          </label>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("Apagar TODOS os dados? Esta ação não pode ser desfeita.")) {
                resetAll();
                toast("Tudo apagado");
              }
            }}
          >
            <RotateCcw className="mr-1.5 h-4 w-4" /> Resetar tudo
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="mb-2 text-sm font-semibold">Sobre</div>
        <p className="text-xs text-muted-foreground">
          OmniTrack v1 · Performance OS. Os dados ficam apenas no seu dispositivo (localStorage).
          Exporte regularmente para backup.
        </p>
      </GlassCard>
    </div>
  );
}
