import { createFileRoute } from "@tanstack/react-router";
import { ProfessorShell } from "@/components/ProfessorShell";
import { Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/professor/fotos")({
  head: () => ({ meta: [{ title: "Foto do Dia — TatameOS" }] }),
  component: Fotos,
});

const photos = [
  "photo-1583454110551-21f2fa2afe61",
  "photo-1555597673-b21d5c935865",
  "photo-1599058917212-d750089bc07e",
  "photo-1544717297-fa95b6ee9643",
  "photo-1518611012118-696072aa579a",
  "photo-1517438476312-10d79c077509",
  "photo-1554068865-24cecd4e34b8",
  "photo-1571019613454-1cb2f99b2d8b",
];

function Fotos() {
  return (
    <ProfessorShell title="Foto do Dia"
      actions={
        <button className="h-9 px-4 bg-brand text-brand-foreground rounded-md text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Upload className="size-4" /> Enviar fotos
        </button>
      }
    >
      <div className="text-sm text-muted-foreground mb-6">Fotos integradas ao calendário — os alunos podem ver e baixar pelo app.</div>
      <div className="grid grid-cols-4 gap-3">
        {photos.map((p, i) => (
          <div key={p} className="aspect-square rounded-lg overflow-hidden bg-surface border border-border relative group">
            <img src={`https://images.unsplash.com/${p}?w=400&h=400&fit=crop`} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              <div className="text-xs">
                <div className="font-semibold">Aula {["Fundamentos", "No-Gi", "Avançado", "Competição"][i % 4]}</div>
                <div className="text-muted-foreground">{i + 1} jun · 2026</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ProfessorShell>
  );
}
