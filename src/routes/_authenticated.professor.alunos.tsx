import { createFileRoute } from "@tanstack/react-router";
import { ProfessorShell } from "@/components/ProfessorShell";
import { BeltBadge } from "@/components/BeltBadge";
import { Avatar } from "@/components/Avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BELTS, type Belt, formatCurrency } from "@/lib/jiujitsu";
import { Pencil, X, Check, UserX, UserCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/professor/alunos")({
  head: () => ({ meta: [{ title: "Alunos — TatameOS" }] }),
  component: Alunos,
});

type EditableProfile = {
  id: string;
  full_name: string;
  belt: Belt;
  stripes: number;
  weight_kg: number | null;
  phone: string | null;
  monthly_fee: number;
  due_day: number;
  active: boolean;
};

function Alunos() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceIso = since.toISOString().slice(0, 10);

      const [profilesRes, attRes] = await Promise.all([
        supabase.from("profiles").select("*").order("full_name"),
        supabase.from("attendances").select("student_id, attended_on").gte("attended_on", sinceIso),
      ]);

      const counts = new Map<string, number>();
      (attRes.data ?? []).forEach((a) => counts.set(a.student_id, (counts.get(a.student_id) ?? 0) + 1));
      return (profilesRes.data ?? []).map((p) => ({ ...p, att30: counts.get(p.id) ?? 0 }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<EditableProfile> & { id: string }) => {
      const { id, ...patch } = payload;
      const { error } = await supabase.from("profiles").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Aluno atualizado");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setEditingId(null);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro ao salvar"),
  });

  const filtered = students.filter((s) => {
    if (filter === "active") return s.active;
    if (filter === "inactive") return !s.active;
    return true;
  });

  return (
    <ProfessorShell title="Alunos">
      <PendingApprovals />

      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-1 bg-surface border border-border rounded-md p-1 text-xs">
          {(["all", "active", "inactive"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`px-3 py-1 rounded ${
                filter === v ? "bg-brand text-brand-foreground" : "text-muted-foreground"
              }`}
            >
              {v === "all" ? "Todos" : v === "active" ? "Ativos" : "Inativos"}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-muted-foreground">{filtered.length} alunos</div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Aluno</th>
              <th className="text-left px-4 py-3 font-medium">Faixa / Grau</th>
              <th className="text-left px-4 py-3 font-medium">Peso</th>
              <th className="text-left px-4 py-3 font-medium">Telefone</th>
              <th className="text-left px-4 py-3 font-medium">Presenças 30d</th>
              <th className="text-left px-4 py-3 font-medium">Mensalidade</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                  Nenhum aluno cadastrado. Eles aparecem aqui assim que se cadastram em <span className="text-brand">/auth</span>.
                </td>
              </tr>
            )}
            {filtered.map((s) =>
              editingId === s.id ? (
                <EditRow
                  key={s.id}
                  student={s}
                  onCancel={() => setEditingId(null)}
                  onSave={(patch) => updateMutation.mutate({ id: s.id, ...patch })}
                  saving={updateMutation.isPending}
                />
              ) : (
                <tr key={s.id} className="hover:bg-surface-2/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.full_name || "Aluno"} url={s.avatar_url} size={32} />
                      <div className="font-semibold">{s.full_name || "(sem nome)"}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <BeltBadge belt={s.belt} stripes={s.stripes} size="sm" />
                  </td>
                  <td className="px-4 py-3 font-mono">{s.weight_kg ? `${s.weight_kg}kg` : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.phone || "—"}</td>
                  <td className="px-4 py-3 font-mono">{s.att30}</td>
                  <td className="px-4 py-3 font-mono">{formatCurrency(s.monthly_fee)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded ${
                        s.active ? "bg-brand/10 text-brand" : "bg-white/5 text-muted-foreground"
                      }`}
                    >
                      {s.active ? "ativo" : "inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => updateMutation.mutate({ id: s.id, active: !s.active })}
                        className="size-8 grid place-items-center text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded"
                        title={s.active ? "Inativar" : "Reativar"}
                      >
                        {s.active ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
                      </button>
                      <button
                        onClick={() => setEditingId(s.id)}
                        className="size-8 grid place-items-center text-muted-foreground hover:text-brand hover:bg-surface-2 rounded"
                      >
                        <Pencil className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </ProfessorShell>
  );
}

function EditRow({
  student,
  onCancel,
  onSave,
  saving,
}: {
  student: EditableProfile;
  onCancel: () => void;
  onSave: (patch: Partial<EditableProfile>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<EditableProfile>({ ...student });
  return (
    <tr className="bg-surface-2/50">
      <td className="px-4 py-3">
        <input
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className="w-full h-9 px-2 bg-background border border-border rounded text-sm"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <select
            value={form.belt}
            onChange={(e) => setForm({ ...form, belt: e.target.value as Belt })}
            className="h-9 px-2 bg-background border border-border rounded text-sm capitalize"
          >
            {BELTS.map((b) => (
              <option key={b} value={b} className="capitalize">
                {b}
              </option>
            ))}
          </select>
          <select
            value={form.stripes}
            onChange={(e) => setForm({ ...form, stripes: Number(e.target.value) })}
            className="h-9 px-2 bg-background border border-border rounded text-sm w-16"
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}°
              </option>
            ))}
          </select>
        </div>
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          step="0.1"
          value={form.weight_kg ?? ""}
          onChange={(e) => setForm({ ...form, weight_kg: e.target.value ? Number(e.target.value) : null })}
          className="w-20 h-9 px-2 bg-background border border-border rounded text-sm"
        />
      </td>
      <td className="px-4 py-3">
        <input
          value={form.phone ?? ""}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-32 h-9 px-2 bg-background border border-border rounded text-sm"
        />
      </td>
      <td className="px-4 py-3 text-muted-foreground">—</td>
      <td className="px-4 py-3">
        <input
          type="number"
          step="0.01"
          value={form.monthly_fee}
          onChange={(e) => setForm({ ...form, monthly_fee: Number(e.target.value) })}
          className="w-24 h-9 px-2 bg-background border border-border rounded text-sm"
        />
      </td>
      <td className="px-4 py-3">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          ativo
        </label>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-1">
          <button
            onClick={onCancel}
            className="size-8 grid place-items-center text-muted-foreground hover:bg-surface-2 rounded"
          >
            <X className="size-4" />
          </button>
          <button
            disabled={saving}
            onClick={() =>
              onSave({
                full_name: form.full_name,
                belt: form.belt,
                stripes: form.stripes,
                weight_kg: form.weight_kg,
                phone: form.phone,
                monthly_fee: form.monthly_fee,
                active: form.active,
              })
            }
            className="size-8 grid place-items-center text-brand hover:bg-brand/10 rounded disabled:opacity-50"
          >
            <Check className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function PendingApprovals() {
  const queryClient = useQueryClient();
  const { data: pending = [] } = useQuery({
    queryKey: ["pending-memberships"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("academy_memberships")
        .select("id, user_id, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!rows?.length) return [];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", rows.map((r) => r.user_id));
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      return rows.map((r) => ({ ...r, profile: map.get(r.user_id) ?? null }));
    },
  });

  const approveMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("approve_membership", { p_membership_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Aluno aprovado");
      queryClient.invalidateQueries({ queryKey: ["pending-memberships"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const rejectMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("reject_membership", { p_membership_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação recusada");
      queryClient.invalidateQueries({ queryKey: ["pending-memberships"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  if (!pending.length) return null;

  return (
    <div className="mb-6 bg-surface border border-brand/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-brand font-bold">Aprovações pendentes</div>
          <div className="text-sm text-muted-foreground">{pending.length} aluno(s) aguardando</div>
        </div>
      </div>
      <div className="space-y-2">
        {pending.map((m) => (
          <div key={m.id} className="flex items-center gap-3 bg-background border border-border rounded p-3">
            <Avatar name={m.profile?.full_name ?? "Aluno"} url={m.profile?.avatar_url ?? null} size={36} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{m.profile?.full_name || "Sem nome"}</div>
              <div className="text-[11px] text-muted-foreground">
                solicitou em {new Date(m.created_at).toLocaleDateString("pt-BR")}
              </div>
            </div>
            <button
              onClick={() => approveMut.mutate(m.id)}
              disabled={approveMut.isPending}
              className="h-8 px-3 bg-brand text-brand-foreground text-xs font-display uppercase tracking-widest hover:bg-white disabled:opacity-50"
            >
              Aprovar
            </button>
            <button
              onClick={() => rejectMut.mutate(m.id)}
              disabled={rejectMut.isPending}
              className="h-8 px-3 border border-border text-muted-foreground text-xs font-display uppercase tracking-widest hover:text-foreground disabled:opacity-50"
            >
              Recusar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
