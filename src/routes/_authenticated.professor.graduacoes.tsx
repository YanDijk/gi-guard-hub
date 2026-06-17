import { createFileRoute } from "@tanstack/react-router";
import { ProfessorShell } from "@/components/ProfessorShell";
import { BeltBadge } from "@/components/BeltBadge";
import { students, graduations } from "@/lib/mock-data";
import { Award, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/professor/graduacoes")({
  head: () => ({ meta: [{ title: "Graduações — TatameOS" }] }),
  component: Graduacoes,
});

function Graduacoes() {
  const candidates = students.filter((s) => s.attendance30d >= 16 && s.status === "ativo").slice(0, 6);

  return (
    <ProfessorShell title="Graduações"
      actions={
        <button className="h-9 px-4 bg-brand text-brand-foreground rounded-md text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Plus className="size-4" /> Cerimônia
        </button>
      }
    >
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-lg p-6">
          <Award className="size-6 text-brand mb-3" />
          <div className="text-3xl font-display">{graduations.length}</div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Próxima cerimônia</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="text-3xl font-display">{candidates.length}</div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Candidatos elegíveis</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="text-3xl font-display">42</div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Graduados em 2026</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="font-display text-lg mb-4">Cerimônia · 20 Jun</h2>
          <div className="space-y-3">
            {graduations.map((g) => (
              <div key={g.id} className="flex items-center gap-3 p-3 bg-surface-2 rounded-md">
                <img src={`https://i.pravatar.cc/40?img=${g.id.charCodeAt(1) + 10}`} className="size-10 rounded-full" alt="" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{g.name}</div>
                  <div className="text-xs text-muted-foreground">{g.from} → <span className="text-brand">{g.to}</span></div>
                </div>
                <Award className="size-4 text-brand" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="font-display text-lg mb-4">Candidatos sugeridos</h2>
          <div className="space-y-3">
            {candidates.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <img src={s.avatar} className="size-9 rounded-full object-cover" alt="" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.attendance30d} presenças em 30d</div>
                </div>
                <BeltBadge belt={s.belt} stripes={s.stripes} size="sm" />
                <button className="text-xs text-brand uppercase tracking-widest hover:underline">Avaliar</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProfessorShell>
  );
}
