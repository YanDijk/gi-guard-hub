import { createFileRoute } from "@tanstack/react-router";
import { ProfessorShell } from "@/components/ProfessorShell";
import { BeltBadge } from "@/components/BeltBadge";
import { Avatar } from "@/components/Avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Award, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BELTS, type Belt } from "@/lib/jiujitsu";

export const Route = createFileRoute("/_authenticated/professor/graduacoes")({
  head: () => ({ meta: [{ title: "Graduações — TatameOS" }] }),
  component: Graduacoes,
});

function Graduacoes() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const todayIso = new Date().toISOString().slice(0, 10);

  const { data: students = [] } = useQuery({
    queryKey: ["students-all"],
    queryFn: async () => (await supabase.from("profiles").select("id, full_name, belt, stripes, avatar_url").order("full_name")).data ?? [],
  });

  const { data: graduations = [], isLoading } = useQuery({
    queryKey: ["graduations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("graduations")
        .select("*, profiles!inner(full_name, avatar_url)")
        .order("ceremony_date", { ascending: false });
      return data ?? [];
    },
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ["candidates"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceIso = since.toISOString().slice(0, 10);
      const [{ data: profs }, { data: atts }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, belt, stripes, avatar_url").eq("active", true),
        supabase.from("attendances").select("student_id").gte("attended_on", sinceIso),
      ]);
      const counts = new Map<string, number>();
      (atts ?? []).forEach((a) => counts.set(a.student_id, (counts.get(a.student_id) ?? 0) + 1));
      return (profs ?? [])
        .map((p) => ({ ...p, att30: counts.get(p.id) ?? 0 }))
        .filter((p) => p.att30 >= 16)
        .sort((a, b) => b.att30 - a.att30)
        .slice(0, 6);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      student_id: string;
      from_belt: Belt;
      from_stripes: number;
      to_belt: Belt;
      to_stripes: number;
      ceremony_date: string;
      notes?: string;
      apply_now: boolean;
    }) => {
      const { apply_now, ...record } = payload;
      const { error } = await supabase.from("graduations").insert(record);
      if (error) throw error;
      if (apply_now) {
        await supabase
          .from("profiles")
          .update({ belt: payload.to_belt, stripes: payload.to_stripes })
          .eq("id", payload.student_id);
      }
    },
    onSuccess: () => {
      toast.success("Graduação registrada");
      queryClient.invalidateQueries({ queryKey: ["graduations"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["students-all"] });
      setShowForm(false);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("graduations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removida");
      queryClient.invalidateQueries({ queryKey: ["graduations"] });
    },
  });

  const upcoming = graduations.filter((g) => g.ceremony_date >= todayIso);
  const history = graduations.filter((g) => g.ceremony_date < todayIso);

  return (
    <ProfessorShell
      title="Graduações"
      actions={
        <button
          onClick={() => setShowForm(true)}
          className="h-9 px-4 bg-brand text-brand-foreground rounded-md text-sm font-bold uppercase tracking-wider flex items-center gap-2"
        >
          <Plus className="size-4" /> Registrar graduação
        </button>
      }
    >
      {showForm && (
        <GraduationForm
          students={students}
          onCancel={() => setShowForm(false)}
          onSubmit={(p) => createMutation.mutate(p)}
          saving={createMutation.isPending}
        />
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-lg p-6">
          <Award className="size-6 text-brand mb-3" />
          <div className="text-3xl font-display">{upcoming.length}</div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Cerimônias agendadas</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="text-3xl font-display">{candidates.length}</div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Candidatos elegíveis (≥16 presenças/30d)</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="text-3xl font-display">{history.length}</div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Graduações registradas</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="font-display text-lg mb-4">Próximas e recentes</h2>
          {isLoading ? (
            <div className="text-muted-foreground">Carregando...</div>
          ) : graduations.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Nenhuma graduação registrada.</div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-auto pr-2">
              {graduations.map((g) => {
                const profile = g.profiles as { full_name: string; avatar_url: string | null } | null;
                const isUpcoming = g.ceremony_date >= todayIso;
                return (
                  <div key={g.id} className="flex items-center gap-3 p-3 bg-surface-2 rounded-md group">
                    <Avatar name={profile?.full_name ?? "Aluno"} url={profile?.avatar_url} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{profile?.full_name ?? "Aluno"}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {g.from_belt} {g.from_stripes}° → <span className="text-brand">{g.to_belt} {g.to_stripes}°</span>
                      </div>
                    </div>
                    <div className="text-xs text-right">
                      <div className={isUpcoming ? "text-brand font-mono" : "text-muted-foreground font-mono"}>
                        {new Date(g.ceremony_date).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Remover esta graduação?")) deleteMutation.mutate(g.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="font-display text-lg mb-4">Candidatos sugeridos</h2>
          {candidates.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              Nenhum aluno atingiu o limite de presenças ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {candidates.map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <Avatar name={s.full_name || "Aluno"} url={s.avatar_url} size={36} />
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{s.full_name || "(sem nome)"}</div>
                    <div className="text-xs text-muted-foreground">{s.att30} presenças em 30d</div>
                  </div>
                  <BeltBadge belt={s.belt} stripes={s.stripes} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProfessorShell>
  );
}

function GraduationForm({
  students,
  onCancel,
  onSubmit,
  saving,
}: {
  students: { id: string; full_name: string; belt: Belt; stripes: number }[];
  onCancel: () => void;
  onSubmit: (p: {
    student_id: string;
    from_belt: Belt;
    from_stripes: number;
    to_belt: Belt;
    to_stripes: number;
    ceremony_date: string;
    apply_now: boolean;
  }) => void;
  saving: boolean;
}) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const selected = students.find((s) => s.id === studentId);
  const [toBelt, setToBelt] = useState<Belt>(selected?.belt ?? "branca");
  const [toStripes, setToStripes] = useState((selected?.stripes ?? 0) + 1);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [applyNow, setApplyNow] = useState(true);

  if (!students.length) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6 mb-6 text-sm text-muted-foreground">
        Cadastre alunos antes de registrar graduações.
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const s = students.find((s) => s.id === studentId);
        if (!s) return;
        onSubmit({
          student_id: studentId,
          from_belt: s.belt,
          from_stripes: s.stripes,
          to_belt: toBelt,
          to_stripes: toStripes,
          ceremony_date: date,
          apply_now: applyNow,
        });
      }}
      className="bg-surface border border-border rounded-lg p-6 mb-6 grid grid-cols-6 gap-3"
    >
      <label className="col-span-2 block">
        <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Aluno</span>
        <select
          value={studentId}
          onChange={(e) => {
            setStudentId(e.target.value);
            const s = students.find((x) => x.id === e.target.value);
            if (s) {
              setToBelt(s.belt);
              setToStripes(Math.min(s.stripes + 1, 4));
            }
          }}
          className="w-full h-9 px-2 bg-background border border-border rounded text-sm"
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name || "(sem nome)"}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Nova faixa</span>
        <select
          value={toBelt}
          onChange={(e) => setToBelt(e.target.value as Belt)}
          className="w-full h-9 px-2 bg-background border border-border rounded text-sm capitalize"
        >
          {BELTS.map((b) => (
            <option key={b} value={b} className="capitalize">
              {b}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Grau</span>
        <select
          value={toStripes}
          onChange={(e) => setToStripes(Number(e.target.value))}
          className="w-full h-9 px-2 bg-background border border-border rounded text-sm"
        >
          {[0, 1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}°
            </option>
          ))}
        </select>
      </label>
      <label className="block col-span-2">
        <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Data da cerimônia</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full h-9 px-2 bg-background border border-border rounded text-sm"
        />
      </label>
      <label className="col-span-3 flex items-center gap-2 text-xs">
        <input type="checkbox" checked={applyNow} onChange={(e) => setApplyNow(e.target.checked)} />
        Já aplicar essa faixa/grau ao perfil do aluno
      </label>
      <div className="col-span-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-9 px-4 border border-border rounded text-sm">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="h-9 px-4 bg-brand text-brand-foreground rounded text-sm font-bold uppercase tracking-wider disabled:opacity-50"
        >
          Registrar
        </button>
      </div>
    </form>
  );
}
