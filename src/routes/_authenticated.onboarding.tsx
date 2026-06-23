import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PLANS } from "@/routes/planos";
import { buildSubdomain } from "@/hooks/use-current-academy";
import { useMyAcademy } from "@/hooks/use-current-academy";
import { Loader2 } from "lucide-react";
import { z } from "zod";

type Search = { plan?: "starter" | "pro" | "elite" };

export const Route = createFileRoute("/_authenticated/onboarding")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    plan: (["starter", "pro", "elite"] as const).includes(s.plan as never)
      ? (s.plan as Search["plan"])
      : undefined,
  }),
  component: OnboardingPage,
});

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

const formSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(80),
  avg_students: z.number().int().min(0).max(100000),
  branches: z.string().trim().max(200).optional(),
  purpose: z.string().trim().min(5, "Descreva brevemente o propósito").max(500),
  plan: z.enum(["starter", "pro", "elite"]),
});

function OnboardingPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/onboarding" });
  const queryClient = useQueryClient();
  const { data: existing, isLoading } = useMyAcademy();

  const [name, setName] = useState("");
  const [avg, setAvg] = useState("30");
  const [branches, setBranches] = useState("");
  const [purpose, setPurpose] = useState("");
  const [plan, setPlan] = useState<"starter" | "pro" | "elite">(search.plan ?? "starter");

  useEffect(() => {
    if (existing) navigate({ to: "/professor" });
  }, [existing, navigate]);

  const createMut = useMutation({
    mutationFn: async () => {
      const parsed = formSchema.parse({
        name,
        avg_students: Number(avg) || 0,
        branches: branches || undefined,
        purpose,
        plan,
      });
      const { data, error } = await supabase.rpc("create_academy", {
        p_name: parsed.name,
        p_avg_students: parsed.avg_students,
        p_branches: parsed.branches ?? "",
        p_purpose: parsed.purpose,
        p_plan: parsed.plan,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Academia criada!");
      queryClient.invalidateQueries();
      navigate({ to: "/professor" });
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Erro ao criar academia");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  const previewSlug = slugify(name) || "sua-academia";

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <span className="text-2xl font-display tracking-tighter italic">
            TATAME<span className="text-brand">OS</span>
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand">
            Passo final
          </span>
          <h1 className="font-display text-4xl uppercase mt-2 mb-2">Crie sua academia</h1>
          <p className="text-white/50 text-sm">
            Em segundos você terá um subdomínio próprio e um link de convite para os alunos.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMut.mutate();
          }}
          className="space-y-6"
        >
          <Field label="Nome da academia *">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Equipe Alfa Jiu-Jitsu"
              className="input"
            />
            <div className="mt-2 text-[11px] uppercase tracking-widest text-white/40">
              Subdomínio: <span className="text-brand">{buildSubdomain(previewSlug)}</span>
            </div>
          </Field>

          <Field label="Quantidade média de alunos *">
            <input
              required
              type="number"
              min={0}
              value={avg}
              onChange={(e) => setAvg(e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Filiais (opcional)">
            <input
              value={branches}
              onChange={(e) => setBranches(e.target.value)}
              placeholder="Ex.: Centro, Zona Sul"
              className="input"
            />
            <p className="mt-1 text-[11px] text-white/40">Separe por vírgulas se houver mais de uma.</p>
          </Field>

          <Field label="Propósito da academia *">
            <textarea
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={3}
              placeholder="Ex.: Formar competidores e fortalecer a comunidade local através do Jiu-Jitsu."
              className="input min-h-[96px] resize-none"
            />
          </Field>

          <Field label="Plano *">
            <div className="grid sm:grid-cols-3 gap-3">
              {PLANS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlan(p.id)}
                  className={`text-left p-4 border transition-colors ${
                    plan === p.id
                      ? "border-brand bg-brand/10"
                      : "border-border bg-surface/50 hover:border-white/30"
                  }`}
                >
                  <div className="font-display uppercase text-sm">{p.name}</div>
                  <div className="text-xs text-white/50">{p.price}{p.period}</div>
                </button>
              ))}
            </div>
          </Field>

          <button
            type="submit"
            disabled={createMut.isPending}
            className="w-full h-12 bg-brand text-brand-foreground font-display uppercase tracking-widest text-sm hover:bg-white transition-colors disabled:opacity-50"
          >
            {createMut.isPending ? "Criando..." : "Criar academia"}
          </button>
        </form>
      </main>

      <style>{`.input{width:100%;height:48px;padding:0 16px;background:hsl(var(--surface));border:1px solid hsl(var(--border));font-size:14px;color:inherit;transition:border-color .15s}.input:focus{outline:none;border-color:hsl(var(--brand))}textarea.input{padding:12px 16px;height:auto}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}
