import { createFileRoute } from "@tanstack/react-router";
import { ProfessorShell } from "@/components/ProfessorShell";
import { tournaments, students } from "@/lib/mock-data";
import { Trophy, MapPin, Calendar, Plus, Users } from "lucide-react";

export const Route = createFileRoute("/professor/campeonatos")({
  head: () => ({ meta: [{ title: "Campeonatos — TatameOS" }] }),
  component: Campeonatos,
});

function Campeonatos() {
  return (
    <ProfessorShell title="Campeonatos"
      actions={
        <button className="h-9 px-4 bg-brand text-brand-foreground rounded-md text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Plus className="size-4" /> Novo evento
        </button>
      }
    >
      <div className="grid grid-cols-3 gap-4">
        {tournaments.map((t) => {
          const convocados = students.slice(0, t.registered);
          return (
            <div key={t.id} className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="aspect-[16/9] bg-gradient-to-br from-brand/30 to-surface-2 flex items-center justify-center">
                <Trophy className="size-12 text-brand" />
              </div>
              <div className="p-5">
                <div className="font-display text-lg">{t.name}</div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1"><Calendar className="size-3" />{new Date(t.date).toLocaleDateString("pt-BR")}</span>
                  <span className="flex items-center gap-1"><MapPin className="size-3" />{t.city}</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {convocados.slice(0, 5).map((s) => (
                      <img key={s.id} src={s.avatar} className="size-7 rounded-full border-2 border-surface" alt="" />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground"><Users className="size-3 inline" /> {t.registered} convocados</span>
                </div>
                <div className="flex gap-2 mt-5">
                  <button className="flex-1 h-9 bg-brand text-brand-foreground rounded-md text-xs font-bold uppercase tracking-wider">Gerenciar</button>
                  <button className="h-9 px-3 border border-border rounded-md text-xs uppercase tracking-wider hover:border-brand">Link</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ProfessorShell>
  );
}
