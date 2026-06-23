import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { resolveNextDestination } from "@/hooks/use-current-academy";

type Search = { redirect?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar — TatameOS" },
      { name: "description", content: "Acesse sua conta TatameOS para gerenciar sua academia ou seu treino." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("E-mail inválido").max(255);
const passwordSchema = z.string().min(8, "Mínimo 8 caracteres").max(72);
const nameSchema = z.string().trim().min(2, "Informe seu nome").max(120);

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  async function goAfterAuth() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const dest = redirect && redirect.startsWith("/") ? redirect : await resolveNextDestination(data.user.id);
    navigate({ to: dest });
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) goAfterAuth();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const emailOk = emailSchema.parse(email);
      const passwordOk = passwordSchema.parse(password);

      if (mode === "signup") {
        const nameOk = nameSchema.parse(fullName);
        const redirectPath = redirect ?? "/onboarding";
        const { error } = await supabase.auth.signUp({
          email: emailOk,
          password: passwordOk,
          options: {
            emailRedirectTo: `${window.location.origin}${redirectPath}`,
            data: { full_name: nameOk },
          },
        });
        if (error) throw error;
        const { data: s } = await supabase.auth.getSession();
        if (s.session) {
          toast.success("Conta criada!");
          await goAfterAuth();
        } else {
          toast.success("Conta criada! Verifique seu e-mail para confirmar.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailOk,
          password: passwordOk,
        });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        await goAfterAuth();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const redirectPath = redirect ?? "/onboarding";
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + redirectPath,
      });
      if (result.error) {
        toast.error("Falha ao entrar com Google");
        return;
      }
      if (result.redirected) return;
      await goAfterAuth();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="text-2xl font-display tracking-tighter italic">
            TATAME<span className="text-brand">OS</span>
          </Link>
          <Link to="/" className="text-xs uppercase tracking-widest text-white/50 hover:text-brand">
            ← Voltar
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-display text-4xl uppercase mb-2">
              {mode === "signin" ? "Entrar" : "Criar conta"}
            </h1>
            <p className="text-white/50 text-sm">
              {mode === "signin"
                ? "Acesse o painel da sua academia."
                : "Comece a gerenciar sua equipe em minutos."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full h-12 border border-border bg-surface hover:bg-surface-2 transition-colors flex items-center justify-center gap-3 text-sm font-semibold disabled:opacity-50"
          >
            <GoogleIcon />
            Continuar com Google
          </button>

          <div className="flex items-center gap-4 my-6 text-[10px] uppercase tracking-widest text-white/30">
            <div className="h-px bg-border flex-1" />
            ou
            <div className="h-px bg-border flex-1" />
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === "signup" && (
              <Field
                label="Nome completo"
                type="text"
                value={fullName}
                onChange={setFullName}
                autoComplete="name"
                required
              />
            )}
            <Field
              label="E-mail"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              required
            />
            <Field
              label="Senha"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-brand text-brand-foreground font-display uppercase tracking-widest text-sm hover:bg-white transition-colors disabled:opacity-50"
            >
              {loading ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <p className="text-center text-sm text-white/50 mt-8">
            {mode === "signin" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-brand hover:underline font-semibold"
            >
              {mode === "signin" ? "Criar conta" : "Entrar"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="w-full h-12 px-4 bg-surface border border-border focus:border-brand focus:outline-none transition-colors text-sm"
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.61z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.71A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
