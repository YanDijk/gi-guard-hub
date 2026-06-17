import { createFileRoute } from "@tanstack/react-router";
import { ProfessorShell } from "@/components/ProfessorShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";
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

  const createMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      level: string;
      day_of_week: number;
      start_time: string;
      duration_min: number;
      capacity: number;
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

  const byDow: Record<number, typeof classes> = {};
  classes.forEach((c) => {
    (byDow[c.day_of_week] ??= []).push(c);
  });

  return (
    <ProfessorShell
      title="Calendário"
      actions={
        <button
          onClick={() => setShowForm(true)}
          className="h-9 px-4 bg-brand text-brand-foreground rounded-md text-sm font-bold uppercase tracking-wider hover:bg-brand/90 flex items-center gap-2"
        >
          <Plus className="size-4" /> Nova aula
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
          Nenhuma aula cadastrada. Clique em <span className="text-brand">Nova aula</span> para começar.
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-3">
          {DAY_LABELS.map((label, dow) => (
            <div key={dow} className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-surface-2 border-b border-border text-xs uppercase tracking-widest text-muted-foreground text-center">
                {label}
              </div>
              <div className="p-2 space-y-2 min-h-32">
                {(byDow[dow] ?? []).map((c) => (
                  <div key={c.id} className="bg-brand/10 border-l-2 border-brand rounded p-2 group relative">
                    <div className="font-display text-sm text-brand">{c.start_time.slice(0, 5)}</div>
                    <div className="text-xs font-bold">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground">{c.level} · {c.duration_min}min</div>
                    <button
                      onClick={() => {
                        if (confirm(`Remover "${c.name}"?`)) deleteMutation.mutate(c.id);
                      }}
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
          ))}
        </div>
      )}
    </ProfessorShell>
  );
}

function ClassForm({
  onCancel,
  onSubmit,
  saving,
}: {
  onCancel: () => void;
  onSubmit: (p: {
    name: string;
    level: string;
    day_of_week: number;
    start_time: string;
    duration_min: number;
    capacity: number;
  }) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    name: "",
    level: "Todos",
    day_of_week: 1,
    start_time: "19:00",
    duration_min: 60,
    capacity: 20,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.name.trim()) return toast.error("Informe o nome da aula");
        onSubmit(form);
      }}
      className="bg-surface border border-border rounded-lg p-6 mb-6 grid grid-cols-6 gap-3"
    >
      <Field label="Nome" className="col-span-2">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className="w-full h-9 px-2 bg-background border border-border rounded text-sm"
        />
      </Field>
      <Field label="Nível">
        <input
          value={form.level}
          onChange={(e) => setForm({ ...form, level: e.target.value })}
          className="w-full h-9 px-2 bg-background border border-border rounded text-sm"
        />
      </Field>
      <Field label="Dia">
        <select
          value={form.day_of_week}
          onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })}
          className="w-full h-9 px-2 bg-background border border-border rounded text-sm"
        >
          {DAY_LABELS.map((d, i) => (
            <option key={i} value={i}>
              {d}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Hora">
        <input
          type="time"
          value={form.start_time}
          onChange={(e) => setForm({ ...form, start_time: e.target.value })}
          className="w-full h-9 px-2 bg-background border border-border rounded text-sm"
        />
      </Field>
      <Field label="Capacidade">
        <input
          type="number"
          min={1}
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
          className="w-full h-9 px-2 bg-background border border-border rounded text-sm"
        />
      </Field>
      <div className="col-span-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-9 px-4 border border-border rounded text-sm">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="h-9 px-4 bg-brand text-brand-foreground rounded text-sm font-bold uppercase tracking-wider disabled:opacity-50"
        >
          Salvar
        </button>
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
