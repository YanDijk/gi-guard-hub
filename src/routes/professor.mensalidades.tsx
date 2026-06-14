import { createFileRoute } from "@tanstack/react-router";
import { ProfessorShell } from "@/components/ProfessorShell";
import { students } from "@/lib/mock-data";
import { Send, DollarSign, AlertCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/professor/mensalidades")({
  head: () => ({ meta: [{ title: "Mensalidades — TatameOS" }] }),
  component: Mensalidades,
});

function Mensalidades() {
  const paid = students.filter((s) => s.paid);
  const overdue = students.filter((s) => !s.paid);
  const revenue = paid.reduce((a, s) => a + s.monthlyFee, 0);
  const expected = students.reduce((a, s) => a + s.monthlyFee, 0);

  return (
    <ProfessorShell title="Mensalidades">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Receita do mês</div>
          <div className="text-3xl font-display">R$ {revenue.toLocaleString("pt-BR")}</div>
          <div className="text-xs text-brand mt-1">de R$ {expected.toLocaleString("pt-BR")} previsto</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Pagas</div>
          <div className="text-3xl font-display flex items-center gap-2"><CheckCircle2 className="size-6 text-brand" />{paid.length}</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Em atraso</div>
          <div className="text-3xl font-display flex items-center gap-2"><AlertCircle className="size-6 text-red-400" />{overdue.length}</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Ticket médio</div>
          <div className="text-3xl font-display flex items-center gap-2"><DollarSign className="size-6 text-brand" />{Math.round(expected / students.length)}</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display">Junho · 2026</h2>
          <button className="h-9 px-3 bg-brand text-brand-foreground rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Send className="size-3" /> Cobrar atrasados
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left px-6 py-3 font-medium">Aluno</th>
              <th className="text-left px-4 py-3 font-medium">Valor</th>
              <th className="text-left px-4 py-3 font-medium">Vencimento</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-6 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {students.map((s, i) => (
              <tr key={s.id} className="hover:bg-surface-2/50">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <img src={s.avatar} className="size-8 rounded-full object-cover" alt="" />
                    <div className="font-semibold">{s.name}</div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono">R$ {s.monthlyFee.toFixed(2)}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{String((i % 28) + 1).padStart(2, "0")}/06/26</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded ${
                    s.paid ? "bg-brand/10 text-brand" : "bg-red-500/10 text-red-400"
                  }`}>{s.paid ? "Pago" : "Atrasado"}</span>
                </td>
                <td className="px-6 py-3 text-right">
                  <button className="text-xs text-brand uppercase tracking-widest hover:underline">
                    {s.paid ? "Recibo" : "Cobrar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ProfessorShell>
  );
}
