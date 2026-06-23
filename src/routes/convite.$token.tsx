import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/convite/$token")({
  head: () => ({
    meta: [
      { title: "Convite — TatameOS" },
      { name: "description", content: "Entre na academia através do convite do seu professor." },
    ],
  }),
  component: InvitePage,
});

const emailSchema = z.string().trim().email("E-mail inválido").max(255);
const passwordSchema = z.string().min(8, "Mínimo 8 caracteres").max(72);
const nameSchema = z.string().trim().min(2, "Informe seu nome").max(120);

function InvitePage() {
  const { token } = useParams({ from: "/convite/$token" });
  const navigate = useNavigate();

  const [academy, setAcademy] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [loadingAcad, setLoadingAcad] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("get_academy_by_invite", { p_token: token });
      if (error || !data || data.length === 0) {
        setAcademy(null);
      } else {
        setAcademy(data[0]);
      }
      setLoadingAcad(false);
      const { data: s } = await supabase.auth.getSession();
      setHasSession(!!s.session);
    })();
  }, [token]);

  async function joinAndGo() {
    const { error } = await supabase.rpc("join_academy_by_token", { p_token: token });
    if (error) {
      toast.error("Não foi possível solicitar entrada.");
      return;
    }
    toast.success("Solicitação enviada! Aguarde a aprovação do professor.");
    navigate({ to: "/aluno" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const emailOk = emailSchema.parse(email);
      const passwordOk = passwordSchema.parse(password);
      if (mode === "signup") {
        const nameOk = nameSchema.parse(fullName);
        const { error } = await supabase.auth.signUp({
          email: emailOk,
          password: passwordOk,
          options: {
            emailRedirectTo: `${window.location.origin}/convite/${token}`,
            data: { full_name: nameOk },
          },
        });
        if (error) throw error;
        const { data: s } = await supabase.auth.getSession();
        if (s.session) {
          await joinAndGo();
        } else {
          toast.success("Conta criada! Verifique seu e-mail para confirmar e volte ao link do convite.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: emailOk, password: passwordOk });
        if (error) throw error;
        await joinAndGo();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/convite/${token}`,
      });
      if (result.error) {
        toast.error("Falha ao entrar com Google");
        return;
      }
      if (result.redirected) return;
      await joinAndGo();
    } finally {
      setLoading(false);
    }
  }

  if (loadingAcad) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (!academy) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-foreground px-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl uppercase mb-3">Convite inválido</h1>
          <p className="text-white/50 text-sm">
            Este link de convite não existe ou foi revogado. Peça um novo ao seu professor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <span className="text-2xl font-display tracking-tighter italic">
            TATAME<span className="text-brand">OS</span>
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <span className="text-[10px] uppercase tracking-widest text-brand font-bold">
              Convite
            </span>
            <h1 className="font-display text-3xl uppercase mt-2 mb-2">{academy.name}</h1>
            <p className="text-white/50 text-sm">
              Crie sua conta para entrar na academia. Sua solicitação ficará pendente até o professor aprovar.
            </p>
          </div>

          {hasSession ? (
            <button
              onClick={joinAndGo}
              className="w-full h-12 bg-brand text-brand-foreground font-display uppercase tracking-widest text-sm hover:bg-white transition-colors"
            >
              Solicitar entrada
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full h-12 border border-border bg-surface hover:bg-surface-2 transition-colors flex items-center justify-center gap-3 text-sm font-semibold disabled:opacity-50"
              >
                Continuar com Google
              </button>

              <div className="flex items-center gap-4 my-6 text-[10px] uppercase tracking-widest text-white/30">
                <div className="h-px bg-border flex-1" /> ou <div className="h-px bg-border flex-1" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <Field label="Nome completo" value={fullName} onChange={setFullName} type="text" />
                )}
                <Field label="E-mail" value={email} onChange={setEmail} type="email" />
                <Field label="Senha" value={password} onChange={setPassword} type="password" />
                <button
                  disabled={loading}
                  className="w-full h-12 bg-brand text-brand-foreground font-display uppercase tracking-widest text-sm hover:bg-white disabled:opacity-50"
                >
                  {loading ? "Aguarde..." : mode === "signup" ? "Criar conta e entrar" : "Entrar"}
                </button>
              </form>

              <p className="text-center text-sm text-white/50 mt-6">
                {mode === "signup" ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                  className="text-brand font-semibold hover:underline"
                >
                  {mode === "signup" ? "Entrar" : "Criar conta"}
                </button>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({
  label, value, onChange, type,
}: { label: string; value: string; onChange: (v: string) => void; type: string }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">{label}</span>
      <input
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 px-4 bg-surface border border-border focus:border-brand focus:outline-none text-sm"
      />
    </label>
  );
}
