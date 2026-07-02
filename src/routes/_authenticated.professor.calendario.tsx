import { createFileRoute } from "@tanstack/react-router";
import { ProfessorShell } from "@/components/ProfessorShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DAY_LABELS } from "@/lib/jiujitsu";

export const Route = createFileRoute("/_authenticated/professor/calendario")({
  head: () => ({ meta: [{ title: "Calendário — TatameOS" }] }),
  component: Calendario,
});

function Calendario() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayDow = new Date().getDay();

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("day_of_week")
        .order("start_time");
      if (error) throw error;
      return data;
    },
  });

  const { data: todayRsvps = [] } = useQuery({
    queryKey: ["today-rsvps", todayIso],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("class_rsvps")
        .select("*, profiles!student_id(full_name)")
        .eq("class_date", todayIso)
        .in("status", ["going", "confirmed"]);
      return data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      name: string; level: string; day_of_week: number;
      start_time: string; duration_min: number; capacity: number;
    }) => {
      const { error } = await supabase.from("classes").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Aula adicionada");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setShowForm(false);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Aula removida");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });

  const confirmRsvp = useMutation({
    mutationFn: async ({ rsvpId, studentId, classId }: { rsvpId: string; studentId: string; classId: string }) => {
      const upd = await (supabase as any).from("class_rsvps").update({ status: "confirmed" }).eq("id", rsvpId);
      if (upd.error) throw upd.error;
      const ins = await supabase.from("attendances").insert({
        student_id: studentId, class_id: classId, attended_on: todayIso,
      });
      if (ins.error && !ins.error.message.includes("duplicate")) throw ins.error;
    },
    onSuccess: () => {
      toast.success("Presença confirmada");
      queryClient.invalidateQueries({ queryKey: ["today-rsvps"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
  });

  const byDow: Record<number, typeof classes> = {};
  classes.forEach((c) => { (byDow[c.day_of_week] ??= []).push(c); });

  const rsvpByClass = new Map<string, number>();
  todayRsvps.forEach((r: any) => {
    rsvpByClass.set(r.class_id, (rsvpByClass.get(r.class_id) ?? 0) + 1);
  });

  return (
    <ProfessorShell
      title="Calendário"
      actions={
        <button
          onClick={() => setShowForm(true)}
          className="h-9 px-3 sm:px-4 bg-brand text-brand-foreground rounded-md text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-brand/90 flex items-center gap-2"
        >
          <Plus className="size-4" /> <span className="hidden sm:inline">Nova aula</span><span className="sm:hidden">Nova</span>
        </button>
      }
    >
      {showForm && (
        <ClassForm onCancel={() => setShowForm(false)} onSubmit={(p) => createMutation.mutate(p)} saving={createMutation.isPending} />
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando grade...</div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg text-muted-foreground">
          Nenhuma aula cadastrada.
        </div>
      ) : (
        <>
          {/* Mobile: lista vertical por dia */}
          <div className="lg:hidden space-y-4">
            {DAY_LABELS.map((label, dow) => {
              const list = byDow[dow] ?? [];
              if (list.length === 0) return null;
              const isToday = dow === todayDow;
              return (
                <div key={dow} className="bg-surface border border-border rounded-lg overflow-hidden">
                  <div className={`px-4 py-2 border-b border-border text-xs uppercase tracking-widest flex items-center justify-between ${isToday ? "bg-brand/10 text-brand" : "bg-surface-2 text-muted-foreground"}`}>
                    <span>{label}{isToday && " · Hoje"}</span>
                    <span className="text-[10px]">{list.length} aula{list.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="divide-y divide-border">
                    {list.map((c) => (
                      <div key={c.id} className="p-3 flex items-center gap-3">
                        <div className="font-display text-lg text-brand w-14 shrink-0">{c.start_time.slice(0, 5)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">{c.name}</div>
                          <div className="text-[11px] text-muted-foreground">{c.level} · {c.duration_min}min · cap. {c.capacity}</div>
                          {isToday && rsvpByClass.get(c.id) ? (
                            <div className="text-[11px] text-brand mt-1 flex items-center gap-1">
                              <Users className="size-3" /> {rsvpByClass.get(c.id)} confirmado(s)
                            </div>
                          ) : null}
                        </div>
                        <button
                          onClick={() => { if (confirm(`Remover "${c.name}"?`)) deleteMutation.mutate(c.id); }}
                          className="size-8 grid place-items-center text-muted-foreground hover:text-red-400 shrink-0"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: grade 7 col */}
          <div className="hidden lg:grid grid-cols-7 gap-3">
            {DAY_LABELS.map((label, dow) => {
              const isToday = dow === todayDow;
              return (
                <div key={dow} className="bg-surface border border-border rounded-lg overflow-hidden">
                  <div className={`px-3 py-2 border-b border-border text-xs uppercase tracking-widest text-center ${isToday ? "bg-brand/10 text-brand" : "bg-surface-2 text-muted-foreground"}`}>
                    {label}
                  </div>
                  <div className="p-2 space-y-2 min-h-32">
                    {(byDow[dow] ?? []).map((c) => (
                      <div key={c.id} className="bg-brand/10 border-l-2 border-brand rounded p-2 group relative">
                        <div className="font-display text-sm text-brand">{c.start_time.slice(0, 5)}</div>
                        <div className="text-xs font-bold">{c.name}</div>
                        <div className="text-[10px] text-muted-foreground">{c.level} · {c.duration_min}min</div>
                        {isToday && rsvpByClass.get(c.id) ? (
                          <div className="text-[10px] text-brand mt-1 flex items-center gap-1">
                            <Users className="size-3" /> {rsvpByClass.get(c.id)}
                          </div>
                        ) : null}
                        <button
                          onClick={() => { if (confirm(`Remover "${c.name}"?`)) deleteMutation.mutate(c.id); }}
                          className="absolute top-1 right-1 size-5 grid place-items-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-400"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                    {(byDow[dow] ?? []).length === 0 && (
                      <div className="text-[10px] text-center text-muted-foreground py-4">vazio</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Painel de RSVPs de hoje */}
          {todayRsvps.length > 0 && (
            <div className="mt-6 bg-surface border border-border rounded-lg p-4 lg:p-6">
              <h2 className="font-display text-lg mb-3 flex items-center gap-2">
                <Users className="size-5 text-brand" /> Confirmados para hoje
              </h2>
              <div className="space-y-3">
                {(byDow[todayDow] ?? []).map((c) => {
                  const rsvps = todayRsvps.filter((r: any) => r.class_id === c.id);
                  if (rsvps.length === 0) return null;
                  return (
                    <div key={c.id} className="border-t border-border pt-3 first:border-0 first:pt-0">
                      <div className="text-xs font-bold text-brand mb-2">
                        {c.start_time.slice(0, 5)} · {c.name} · {rsvps.length} aluno(s)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {rsvps.map((r: any) => (
                          <button
                            key={r.id}
                            disabled={r.status === "confirmed" || confirmRsvp.isPending}
                            onClick={() => confirmRsvp.mutate({ rsvpId: r.id, studentId: r.student_id, classId: r.class_id })}
                            className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${r.status === "confirmed" ? "bg-brand/20 text-brand cursor-default" : "bg-surface-2 text-muted-foreground hover:bg-brand/10 hover:text-brand"}`}
                            title={r.status === "confirmed" ? "Presença confirmada" : "Clique para confirmar presença"}
                          >
                            {r.profiles?.full_name ?? "Aluno"} {r.status === "confirmed" ? "✓" : ""}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </ProfessorShell>
  );
}

function ClassForm({
  onCancel, onSubmit, saving,
}: {
  onCancel: () => void;
  onSubmit: (p: { name: string; level: string; day_of_week: number; start_time: string; duration_min: number; capacity: number }) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    name: "", level: "Todos", day_of_week: 1, start_time: "19:00", duration_min: 60, capacity: 20,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.name.trim()) return toast.error("Informe o nome da aula");
        onSubmit(form);
      }}
      className="bg-surface border border-border rounded-lg p-4 sm:p-6 mb-6 grid grid-cols-2 sm:grid-cols-6 gap-3"
    >
      <Field label="Nome" className="col-span-2">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full h-9 px-2 bg-background border border-border rounded text-sm" />
      </Field>
      <Field label="Nível" className="col-span-2 sm:col-span-1">
        <input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full h-9 px-2 bg-background border border-border rounded text-sm" />
      </Field>
      <Field label="Dia">
        <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })} className="w-full h-9 px-2 bg-background border border-border rounded text-sm">
          {DAY_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
        </select>
      </Field>
      <Field label="Hora">
        <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-full h-9 px-2 bg-background border border-border rounded text-sm" />
      </Field>
      <Field label="Capacidade">
        <input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} className="w-full h-9 px-2 bg-background border border-border rounded text-sm" />
      </Field>
      <div className="col-span-2 sm:col-span-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-9 px-4 border border-border rounded text-sm">Cancelar</button>
        <button type="submit" disabled={saving} className="h-9 px-4 bg-brand text-brand-foreground rounded text-sm font-bold uppercase tracking-wider disabled:opacity-50">Salvar</button>
      </div>
    </form>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}
