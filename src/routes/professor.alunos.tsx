import { createFileRoute } from "@tanstack/react-router";
import { ProfessorShell } from "@/components/ProfessorShell";
import { BeltBadge } from "@/components/BeltBadge";
import { students } from "@/lib/mock-data";
import { Plus, Filter, Download } from "lucide-react";

export const Route = createFileRoute("/professor/alunos")({
  head: () => ({ meta: [{ title: "Alunos — TatameOS" }] }),
  component: Alunos,
});

function Alunos() {
  return (
    <ProfessorShell
      title="Alunos"
      actions={
        <button className="h-9 px-4 bg-brand text-brand-foreground rounded-md text-sm font-bold uppercase tracking-wider hover:bg-brand/90 flex items-center gap-2">
          <Plus className="size-4" /> Novo aluno
        </button>
      }
    >
      <div className="flex items-center gap-3 mb-6">
        <button className="h-9 px-3 bg-surface border border-border rounded-md text-sm flex items-center gap-2 hover:border-brand">
          <Filter className="size-4" /> Filtrar
        </button>
        <button className="h-9 px-3 bg-surface border border-border rounded-md text-sm flex items-center gap-2 hover:border-brand">
          <Download className="size-4" /> Exportar
        </button>
        <div className="ml-auto text-xs text-muted-foreground">{students.length} alunos</div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Aluno</th>
              <th className="text-left px-4 py-3 font-medium">Faixa</th>
              <th className="text-left px-4 py-3 font-medium">Peso</th>
              <th className="text-left px-4 py-3 font-medium">Telefone</th>
              <th className="text-left px-4 py-3 font-medium">Presenças (30d)</th>
              <th className="text-left px-4 py-3 font-medium">Mensalidade</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-surface-2/50 cursor-pointer">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={s.avatar} className="size-8 rounded-full object-cover" alt="" />
                    <div className="font-semibold">{s.name}</div>
                  </div>
                </td>
                <td className="px-4 py-3"><BeltBadge belt={s.belt} stripes={s.stripes} size="sm" /></td>
                <td className="px-4 py-3 font-mono">{s.weight}kg</td>
                <td className="px-4 py-3 text-muted-foreground">{s.phone}</td>
                <td className="px-4 py-3 font-mono">{s.attendance30d}</td>
                <td className="px-4 py-3 font-mono">R$ {s.monthlyFee}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded ${
                    s.status === "ativo" ? "bg-brand/10 text-brand" : s.status === "inadimplente" ? "bg-red-500/10 text-red-400" : "bg-white/5 text-muted-foreground"
                  }`}>{s.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ProfessorShell>
  );
}
