import { createFileRoute } from "@tanstack/react-router";
import { ProfessorShell } from "@/components/ProfessorShell";
import { Avatar } from "@/components/Avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, AlertCircle, CheckCircle2, Wand2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, monthKey } from "@/lib/jiujitsu";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/professor/mensalidades")({
  head: () => ({ meta: [{ title: "Mensalidades — TatameOS" }] }),
  component: Mensalidades,
});

function Mensalidades() {
  const queryClient = useQueryClient();
  const today = new Date();
  const refMonth = monthKey(today);
  const monthLabel = today.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("monthly_plans").select("*").order("amount");
      if (error) throw error;
      return data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["payments", refMonth],
    queryFn: async () => {
      const [studentsRes, paymentsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("active", true).order("full_name"),
        supabase.from("payments").select("*").eq("reference_month", refMonth),
      ]);
      const byStudent = new Map(paymentsRes.data?.map((p) => [p.student_id, p]) ?? []);
      return (studentsRes.data ?? []).map((s) => ({ student: s, payment: byStudent.get(s.id) ?? null }));
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

  const assignPlan = useMutation({
    mutationFn: async ({ studentId, planId }: { studentId: string; planId: string | null }) => {
      const plan = plans.find((p) => p.id === planId);
      const patch = plan
        ? { plan_id: plan.id, monthly_fee: plan.amount, due_day: plan.due_day }
        : { plan_id: null };
      const { error } = await supabase.from("profiles").update(patch).eq("id", studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plano atribuído");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
  });

  const todayIso = today.toISOString().slice(0, 10);
  const paid = data?.filter((r) => r.payment?.paid_at) ?? [];
  const overdue = data?.filter((r) => r.payment && !r.payment.paid_at && r.payment.due_date < todayIso) ?? [];
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
          className="h-9 px-3 lg:px-4 bg-brand text-brand-foreground rounded-md text-xs lg:text-sm font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
        >
          <Wand2 className="size-4" />
          <span className="hidden sm:inline">Gerar cobranças do mês</span>
          <span className="sm:hidden">Gerar</span>
        </button>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kpi label="Receita do mês" value={formatCurrency(revenue)} hint={`de ${formatCurrency(expected)}`} />
        <Kpi label="Pagas" value={paid.length} icon={CheckCircle2} color="text-brand" />
        <Kpi label="Em atraso" value={overdue.length} icon={AlertCircle} color="text-red-400" />
        <Kpi label="Sem cobrança" value={noBill.length} icon={DollarSign} color="text-muted-foreground" />
      </div>

      <PlansSection plans={plans} />

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 lg:px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display capitalize text-sm lg:text-base">{monthLabel}</h2>
          <div className="text-xs text-muted-foreground">{data?.length ?? 0} alunos ativos</div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Aluno</th>
                <th className="text-left px-4 py-3 font-medium">Plano</th>
                <th className="text-left px-4 py-3 font-medium">Valor</th>
                <th className="text-left px-4 py-3 font-medium">Vencimento</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Carregando...</td></tr>
              )}
              {!isLoading && (data?.length ?? 0) === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Nenhum aluno ativo.</td></tr>
              )}
              {data?.map((row) => {
                const p = row.payment;
                const status = !p ? "não cobrado" : p.paid_at ? "pago" : p.due_date < todayIso ? "atrasado" : "pendente";
                const cls =
                  status === "pago" ? "bg-brand/10 text-brand"
                  : status === "atrasado" ? "bg-red-500/10 text-red-400"
                  : status === "pendente" ? "bg-yellow-500/10 text-yellow-400"
                  : "bg-white/5 text-muted-foreground";
                return (
                  <tr key={row.student.id} className="hover:bg-surface-2/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={row.student.full_name || "Aluno"} url={row.student.avatar_url} size={32} />
                        <div className="font-semibold">{row.student.full_name || "(sem nome)"}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={row.student.plan_id ?? ""}
                        onChange={(e) => assignPlan.mutate({ studentId: row.student.id, planId: e.target.value || null })}
                        className="h-8 px-2 bg-background border border-border rounded text-xs"
                      >
                        <option value="">— sem plano —</option>
                        {plans.map((pl) => (
                          <option key={pl.id} value={pl.id}>{pl.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 font-mono">{formatCurrency(p?.amount ?? row.student.monthly_fee)}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {p ? new Date(p.due_date).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded ${cls}`}>{status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
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

        <div className="md:hidden divide-y divide-border">
          {data?.map((row) => {
            const p = row.payment;
            const status = !p ? "não cobrado" : p.paid_at ? "pago" : p.due_date < todayIso ? "atrasado" : "pendente";
            const cls =
              status === "pago" ? "bg-brand/10 text-brand"
              : status === "atrasado" ? "bg-red-500/10 text-red-400"
              : status === "pendente" ? "bg-yellow-500/10 text-yellow-400"
              : "bg-white/5 text-muted-foreground";
            return (
              <div key={row.student.id} className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar name={row.student.full_name || "Aluno"} url={row.student.avatar_url} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{row.student.full_name || "(sem nome)"}</div>
                    <div className="font-mono text-xs text-muted-foreground">{formatCurrency(p?.amount ?? row.student.monthly_fee)}</div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded ${cls} shrink-0`}>{status}</span>
                </div>
                <select
                  value={row.student.plan_id ?? ""}
                  onChange={(e) => assignPlan.mutate({ studentId: row.student.id, planId: e.target.value || null })}
                  className="w-full h-9 px-2 bg-background border border-border rounded text-xs"
                >
                  <option value="">— sem plano —</option>
                  {plans.map((pl) => (
                    <option key={pl.id} value={pl.id}>{pl.name} · {formatCurrency(pl.amount)}</option>
                  ))}
                </select>
                {p && (
                  <button
                    onClick={() => togglePaid.mutate({ id: p.id, paid: !p.paid_at })}
                    className="w-full h-8 border border-border text-xs text-brand uppercase tracking-widest"
                  >
                    {p.paid_at ? "Desfazer pagamento" : "Marcar como pago"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ProfessorShell>
  );
}

function PlansSection({ plans }: { plans: Array<{ id: string; name: string; amount: number; due_day: number; active: boolean }> }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("10");

  const createMut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Informe o nome");
      const amt = Number(amount);
      if (!amt || amt <= 0) throw new Error("Valor inválido");
      const dd = Math.min(28, Math.max(1, Number(dueDay) || 10));
      const { error } = await supabase.from("monthly_plans").insert({ name: name.trim(), amount: amt, due_day: dd } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plano criado");
      setName(""); setAmount(""); setDueDay("10");
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("monthly_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plano removido");
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <div className="bg-surface border border-border rounded-lg p-4 lg:p-5 mb-6">
      <h2 className="font-display text-sm lg:text-base mb-3">Planos de mensalidade</h2>
      <div className="space-y-2 mb-4">
        {plans.length === 0 && (
          <div className="text-xs text-muted-foreground border border-dashed border-border rounded p-3">
            Nenhum plano cadastrado. Crie planos para que seus alunos possam escolher.
          </div>
        )}
        {plans.map((p) => (
          <div key={p.id} className="flex items-center gap-3 bg-background border border-border rounded p-2">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{p.name}</div>
              <div className="text-[11px] text-muted-foreground">Vence dia {p.due_day}</div>
            </div>
            <div className="font-mono text-sm">{formatCurrency(p.amount)}</div>
            <button
              onClick={() => { if (confirm("Remover plano?")) delMut.mutate(p.id); }}
              className="size-8 grid place-items-center text-muted-foreground hover:text-red-400 rounded"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }}
        className="grid grid-cols-1 sm:grid-cols-[1fr_120px_90px_auto] gap-2"
      >
        <input
          placeholder="Nome (ex: 2x/semana)"
          value={name} onChange={(e) => setName(e.target.value)}
          className="h-9 px-3 bg-background border border-border rounded text-sm"
        />
        <input
          placeholder="Valor"
          type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
          className="h-9 px-3 bg-background border border-border rounded text-sm"
        />
        <input
          placeholder="Dia"
          type="number" min={1} max={28} value={dueDay} onChange={(e) => setDueDay(e.target.value)}
          className="h-9 px-3 bg-background border border-border rounded text-sm"
        />
        <button
          disabled={createMut.isPending}
          className="h-9 px-3 bg-brand text-brand-foreground rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 disabled:opacity-50"
        >
          <Plus className="size-4" /> Adicionar
        </button>
      </form>
    </div>
  );
}

function Kpi({
  label, value, hint, icon: Icon, color = "text-foreground",
}: {
  label: string; value: React.ReactNode; hint?: string;
  icon?: React.ComponentType<{ className?: string }>; color?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3 lg:p-5">
      <div className="text-[10px] lg:text-xs uppercase tracking-widest text-muted-foreground mb-1 lg:mb-2">{label}</div>
      <div className="text-xl lg:text-3xl font-display flex items-center gap-2">
        {Icon && <Icon className={`size-5 lg:size-6 ${color}`} />}
        {value}
      </div>
      {hint && <div className="text-[10px] lg:text-xs text-brand mt-1">{hint}</div>}
    </div>
  );
}
