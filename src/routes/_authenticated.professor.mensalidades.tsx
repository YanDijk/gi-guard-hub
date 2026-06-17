import { createFileRoute } from "@tanstack/react-router";
import { ProfessorShell } from "@/components/ProfessorShell";
import { Avatar } from "@/routes/_authenticated.professor.index";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, AlertCircle, CheckCircle2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, monthKey } from "@/lib/jiujitsu";

export const Route = createFileRoute("/_authenticated/professor/mensalidades")({
  head: () => ({ meta: [{ title: "Mensalidades — TatameOS" }] }),
  component: Mensalidades,
});

function Mensalidades() {
  const queryClient = useQueryClient();
  const today = new Date();
  const refMonth = monthKey(today);
  const monthLabel = today.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const { data, isLoading } = useQuery({
    queryKey: ["payments", refMonth],
    queryFn: async () => {
      const [studentsRes, paymentsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("active", true).order("full_name"),
        supabase.from("payments").select("*").eq("reference_month", refMonth),
      ]);
      const byStudent = new Map(paymentsRes.data?.map((p) => [p.student_id, p]) ?? []);
      const rows = (studentsRes.data ?? []).map((s) => ({
        student: s,
        payment: byStudent.get(s.id) ?? null,
      }));
      return rows;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!data) return 0;
      const missing = data.filter((r) => !r.payment && Number(r.student.monthly_fee) > 0);
      if (missing.length === 0) return 0;
      const year = today.getFullYear();
      const month = today.getMonth();
      const inserts = missing.map((r) => ({
        student_id: r.student.id,
        reference_month: refMonth,
        amount: r.student.monthly_fee,
        due_date: new Date(year, month, r.student.due_day).toISOString().slice(0, 10),
      }));
      const { error } = await supabase.from("payments").insert(inserts);
      if (error) throw error;
      return inserts.length;
    },
    onSuccess: (count) => {
      if (count === 0) toast.message("Nenhuma cobrança nova a gerar");
      else toast.success(`${count} cobrança(s) geradas`);
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
  });

  const togglePaid = useMutation({
    mutationFn: async ({ id, paid }: { id: string; paid: boolean }) => {
      const { error } = await supabase
        .from("payments")
        .update({ paid_at: paid ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });

  const todayIso = today.toISOString().slice(0, 10);
  const paid = data?.filter((r) => r.payment?.paid_at) ?? [];
  const overdue = data?.filter((r) => r.payment && !r.payment.paid_at && r.payment.due_date < todayIso) ?? [];
  const pending = data?.filter((r) => r.payment && !r.payment.paid_at && r.payment.due_date >= todayIso) ?? [];
  const noBill = data?.filter((r) => !r.payment) ?? [];
  const revenue = paid.reduce((acc, r) => acc + Number(r.payment!.amount), 0);
  const expected = (data ?? []).reduce(
    (acc, r) => acc + Number(r.payment?.amount ?? r.student.monthly_fee),
    0,
  );

  return (
    <ProfessorShell
      title="Mensalidades"
      actions={
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="h-9 px-4 bg-brand text-brand-foreground rounded-md text-sm font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
        >
          <Wand2 className="size-4" /> Gerar cobranças do mês
        </button>
      }
    >
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Kpi label="Receita do mês" value={formatCurrency(revenue)} hint={`de ${formatCurrency(expected)} previsto`} />
        <Kpi label="Pagas" value={paid.length} icon={CheckCircle2} color="text-brand" />
        <Kpi label="Em atraso" value={overdue.length} icon={AlertCircle} color="text-red-400" />
        <Kpi label="Sem cobrança" value={noBill.length} icon={DollarSign} color="text-muted-foreground" />
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display capitalize">{monthLabel}</h2>
          <div className="text-xs text-muted-foreground">{data?.length ?? 0} alunos ativos</div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left px-6 py-3 font-medium">Aluno</th>
              <th className="text-left px-4 py-3 font-medium">Valor</th>
              <th className="text-left px-4 py-3 font-medium">Vencimento</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-6 py-3 font-medium">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && (data?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  Nenhum aluno ativo.
                </td>
              </tr>
            )}
            {data?.map((row) => {
              const p = row.payment;
              const status = !p
                ? "não cobrado"
                : p.paid_at
                  ? "pago"
                  : p.due_date < todayIso
                    ? "atrasado"
                    : "pendente";
              const cls =
                status === "pago"
                  ? "bg-brand/10 text-brand"
                  : status === "atrasado"
                    ? "bg-red-500/10 text-red-400"
                    : status === "pendente"
                      ? "bg-yellow-500/10 text-yellow-400"
                      : "bg-white/5 text-muted-foreground";
              return (
                <tr key={row.student.id} className="hover:bg-surface-2/50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={row.student.full_name || "Aluno"} url={row.student.avatar_url} size={32} />
                      <div className="font-semibold">{row.student.full_name || "(sem nome)"}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono">{formatCurrency(p?.amount ?? row.student.monthly_fee)}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">
                    {p ? new Date(p.due_date).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded ${cls}`}>{status}</span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    {p ? (
                      <button
                        onClick={() => togglePaid.mutate({ id: p.id, paid: !p.paid_at })}
                        className="text-xs text-brand uppercase tracking-widest hover:underline"
                      >
                        {p.paid_at ? "Desfazer" : "Marcar pago"}
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ProfessorShell>
  );
}

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  color = "text-foreground",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{label}</div>
      <div className="text-3xl font-display flex items-center gap-2">
        {Icon && <Icon className={`size-6 ${color}`} />}
        {value}
      </div>
      {hint && <div className="text-xs text-brand mt-1">{hint}</div>}
    </div>
  );
}
