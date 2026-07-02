import { createFileRoute } from "@tanstack/react-router";
import { ProfessorShell } from "@/components/ProfessorShell";
import { Avatar } from "@/components/Avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, MapPin, Calendar, Plus, Users, Trash2, ExternalLink, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { SignupStatus } from "@/lib/jiujitsu";

export const Route = createFileRoute("/_authenticated/professor/campeonatos")({
  head: () => ({ meta: [{ title: "Campeonatos — TatameOS" }] }),
  component: Campeonatos,
});

type TournamentForm = { name: string; city: string; event_date: string; registration_url?: string; notes?: string };
type TournamentRow = TournamentForm & { id: string };

function Campeonatos() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState<false | { mode: "create" } | { mode: "edit"; t: TournamentRow }>(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => (await supabase.from("tournaments").select("*").order("event_date")).data ?? [],
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students-all"],
    queryFn: async () => (await supabase.from("profiles").select("id, full_name, avatar_url").order("full_name")).data ?? [],
  });

  const { data: signups = [] } = useQuery({
    queryKey: ["signups"],
    queryFn: async () => (await supabase.from("tournament_signups").select("*, profiles!inner(full_name, avatar_url)")).data ?? [],
  });

  const createT = useMutation({
    mutationFn: async (p: TournamentForm) => {
      const { error } = await supabase.from("tournaments").insert(p);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Campeonato adicionado");
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      setFormOpen(false);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
  });

  const updateT = useMutation({
    mutationFn: async ({ id, ...p }: TournamentRow) => {
      const { error } = await supabase.from("tournaments").update(p).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Campeonato atualizado");
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      setFormOpen(false);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
  });

  const deleteT = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tournaments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tournaments"] }),
  });

  const addSignup = useMutation({
    mutationFn: async (p: { tournament_id: string; student_id: string }) => {
      const { error } = await supabase.from("tournament_signups").insert({ ...p, status: "convocado" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["signups"] }),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SignupStatus }) => {
      const { error } = await supabase.from("tournament_signups").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["signups"] }),
  });

  const removeSignup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tournament_signups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["signups"] }),
  });

  return (
    <ProfessorShell
      title="Campeonatos"
      actions={
        <button
          onClick={() => setFormOpen({ mode: "create" })}
          className="h-9 px-3 sm:px-4 bg-brand text-brand-foreground rounded-md text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2"
        >
          <Plus className="size-4" /> <span className="hidden sm:inline">Novo evento</span><span className="sm:hidden">Novo</span>
        </button>
      }
    >
      {formOpen && (
        <TournamentFormEl
          initial={formOpen.mode === "edit" ? formOpen.t : undefined}
          onCancel={() => setFormOpen(false)}
          onSubmit={(p) => {
            if (formOpen.mode === "edit") updateT.mutate({ ...p, id: formOpen.t.id });
            else createT.mutate(p);
          }}
          saving={createT.isPending || updateT.isPending}
        />
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg text-muted-foreground">
          Nenhum campeonato cadastrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tournaments.map((t) => {
            const ts = signups.filter((s) => s.tournament_id === t.id);
            const isOpen = expanded === t.id;
            return (
              <div key={t.id} className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
                <div className="aspect-[16/9] bg-gradient-to-br from-brand/30 to-surface-2 flex items-center justify-center relative">
                  <Trophy className="size-12 text-brand" />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => setFormOpen({ mode: "edit", t: t as TournamentRow })}
                      className="size-8 grid place-items-center bg-black/60 rounded text-white hover:text-brand"
                      title="Editar"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Excluir "${t.name}"?`)) deleteT.mutate(t.id); }}
                      className="size-8 grid place-items-center bg-black/60 rounded text-white hover:text-red-400"
                      title="Excluir"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-4 sm:p-5 flex-1 flex flex-col">
                  <div className="font-display text-lg truncate">{t.name}</div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {new Date(t.event_date).toLocaleDateString("pt-BR")}
                    </span>
                    {t.city && <span className="flex items-center gap-1"><MapPin className="size-3" />{t.city}</span>}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Users className="size-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{ts.length} convocações</span>
                  </div>
                  <div className="flex gap-2 mt-auto pt-4">
                    <button
                      onClick={() => setExpanded(isOpen ? null : t.id)}
                      className="flex-1 h-10 bg-brand text-brand-foreground rounded-md text-xs font-bold uppercase tracking-wider"
                    >
                      {isOpen ? "Fechar" : "Gerenciar"}
                    </button>
                    {t.registration_url && (
                      <a href={t.registration_url} target="_blank" rel="noreferrer"
                        className="h-10 px-3 border border-border rounded-md text-xs uppercase tracking-wider hover:border-brand inline-flex items-center gap-1">
                        <ExternalLink className="size-3" /> Link
                      </a>
                    )}
                  </div>

                  {isOpen && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <SignupPicker
                        students={students.filter((s) => !ts.some((x) => x.student_id === s.id))}
                        onPick={(student_id) => addSignup.mutate({ tournament_id: t.id, student_id })}
                      />
                      <div className="space-y-2 mt-3 max-h-60 overflow-auto">
                        {ts.map((s) => {
                          const prof = s.profiles as { full_name: string; avatar_url: string | null } | null;
                          return (
                            <div key={s.id} className="flex items-center gap-2 text-xs min-w-0">
                              <Avatar name={prof?.full_name ?? "Aluno"} url={prof?.avatar_url} size={24} />
                              <div className="flex-1 truncate">{prof?.full_name ?? "Aluno"}</div>
                              <select
                                value={s.status}
                                onChange={(e) => setStatus.mutate({ id: s.id, status: e.target.value as SignupStatus })}
                                className="h-7 bg-background border border-border rounded text-xs px-1"
                              >
                                <option value="recomendado">recomendado</option>
                                <option value="convocado">convocado</option>
                                <option value="inscrito">inscrito</option>
                              </select>
                              <button onClick={() => removeSignup.mutate(s.id)} className="text-muted-foreground hover:text-red-400">
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ProfessorShell>
  );
}

function SignupPicker({ students, onPick }: { students: { id: string; full_name: string }[]; onPick: (id: string) => void }) {
  const [value, setValue] = useState("");
  if (students.length === 0) return <div className="text-xs text-muted-foreground">Todos os alunos já foram convocados.</div>;
  return (
    <div className="flex gap-2">
      <select value={value} onChange={(e) => setValue(e.target.value)} className="flex-1 h-9 px-2 bg-background border border-border rounded text-xs">
        <option value="">Convocar aluno...</option>
        {students.map((s) => <option key={s.id} value={s.id}>{s.full_name || "(sem nome)"}</option>)}
      </select>
      <button
        disabled={!value}
        onClick={() => { if (value) { onPick(value); setValue(""); } }}
        className="h-9 px-3 bg-brand text-brand-foreground rounded text-xs font-bold uppercase tracking-wider disabled:opacity-50"
      >Add</button>
    </div>
  );
}

function TournamentFormEl({
  initial, onCancel, onSubmit, saving,
}: {
  initial?: TournamentForm;
  onCancel: () => void;
  onSubmit: (p: TournamentForm) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<TournamentForm>({
    name: initial?.name ?? "",
    city: initial?.city ?? "",
    event_date: initial?.event_date ?? new Date().toISOString().slice(0, 10),
    registration_url: initial?.registration_url ?? "",
    notes: initial?.notes ?? "",
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.name.trim()) return toast.error("Informe o nome");
        onSubmit({ ...form, registration_url: form.registration_url || undefined, notes: form.notes || undefined });
      }}
      className="bg-surface border border-border rounded-lg p-4 sm:p-6 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3"
    >
      <label className="col-span-2 block">
        <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Nome</span>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-9 px-2 bg-background border border-border rounded text-sm" required />
      </label>
      <label className="block">
        <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Cidade</span>
        <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full h-9 px-2 bg-background border border-border rounded text-sm" />
      </label>
      <label className="block">
        <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Data</span>
        <input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="w-full h-9 px-2 bg-background border border-border rounded text-sm" required />
      </label>
      <label className="col-span-2 sm:col-span-4 block">
        <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Link de inscrição</span>
        <input type="url" value={form.registration_url} onChange={(e) => setForm({ ...form, registration_url: e.target.value })} placeholder="https://..." className="w-full h-9 px-2 bg-background border border-border rounded text-sm" />
      </label>
      <label className="col-span-2 sm:col-span-4 block">
        <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Notas</span>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm" />
      </label>
      <div className="col-span-2 sm:col-span-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-9 px-4 border border-border rounded text-sm">Cancelar</button>
        <button type="submit" disabled={saving} className="h-9 px-4 bg-brand text-brand-foreground rounded text-sm font-bold uppercase tracking-wider disabled:opacity-50">
          {initial ? "Salvar" : "Criar"}
        </button>
      </div>
    </form>
  );
}
