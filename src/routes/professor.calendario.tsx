import { createFileRoute } from "@tanstack/react-router";
import { ProfessorShell } from "@/components/ProfessorShell";
import { todayClasses } from "@/lib/mock-data";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/professor/calendario")({
  head: () => ({ meta: [{ title: "Calendário — TatameOS" }] }),
  component: Calendario,
});

function Calendario() {
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const hours = ["06:30", "08:00", "12:00", "18:00", "19:00", "20:30"];
  const classes: Record<string, { name: string; level: string }> = {
    "Seg-06:30": { name: "Fundamentos", level: "Iniciante" },
    "Ter-19:00": { name: "Avançado", level: "Roxa+" },
    "Qua-12:00": { name: "No-Gi", level: "Todos" },
    "Qua-20:30": { name: "Competição", level: "Convocados" },
    "Qui-06:30": { name: "Fundamentos", level: "Iniciante" },
    "Sex-19:00": { name: "Avançado", level: "Roxa+" },
    "Sáb-08:00": { name: "Open Mat", level: "Todos" },
  };

  return (
    <ProfessorShell
      title="Calendário"
      actions={
        <button className="h-9 px-4 bg-brand text-brand-foreground rounded-md text-sm font-bold uppercase tracking-wider hover:bg-brand/90 flex items-center gap-2">
          <Plus className="size-4" /> Nova aula
        </button>
      }
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button className="size-9 bg-surface border border-border rounded-md flex items-center justify-center hover:border-brand">
            <ChevronLeft className="size-4" />
          </button>
          <div className="px-4 font-display text-lg">Junho 2026 — Semana 24</div>
          <button className="size-9 bg-surface border border-border rounded-md flex items-center justify-center hover:border-brand">
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="flex gap-1 bg-surface border border-border rounded-md p-1 text-xs">
          {["Dia", "Semana", "Mês"].map((v, i) => (
            <button key={v} className={`px-3 py-1 rounded ${i === 1 ? "bg-brand text-brand-foreground" : "text-muted-foreground"}`}>{v}</button>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7">
          <div className="border-r border-b border-border bg-surface-2 px-3 py-3 text-xs uppercase tracking-widest text-muted-foreground">Hora</div>
          {days.map((d, i) => (
            <div key={d} className="border-r last:border-r-0 border-b border-border bg-surface-2 px-3 py-3 text-xs uppercase tracking-widest text-muted-foreground text-center">
              {d} <span className="text-foreground font-bold ml-1">{8 + i}</span>
            </div>
          ))}
          {hours.map((h) => (
            <div key={h} className="contents">
              <div className="border-r border-b border-border px-3 py-4 text-xs font-mono text-muted-foreground">{h}</div>
              {days.map((d) => {
                const cls = classes[`${d}-${h}`];
                return (
                  <div key={`${d}-${h}`} className="border-r last:border-r-0 border-b border-border p-1.5 min-h-20">
                    {cls && (
                      <div className="h-full bg-brand/10 border-l-2 border-brand rounded p-2">
                        <div className="text-xs font-bold">{cls.name}</div>
                        <div className="text-[10px] text-muted-foreground">{cls.level}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-3">
        {todayClasses.map((c) => (
          <div key={c.id} className="bg-surface border border-border rounded-lg p-4">
            <div className="font-display text-xl text-brand">{c.time}</div>
            <div className="text-sm font-semibold mt-1">{c.name}</div>
            <div className="text-xs text-muted-foreground">{c.confirmed}/{c.capacity} confirmados</div>
          </div>
        ))}
      </div>
    </ProfessorShell>
  );
}
