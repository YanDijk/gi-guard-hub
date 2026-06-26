import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Upload } from "lucide-react";
import { BELTS, type Belt, formatCurrency } from "@/lib/jiujitsu";

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

type Plan = { id: string; name: string; amount: number; due_day: number };

function InvitePage() {
  const { token } = useParams({ from: "/convite/$token" });
  const navigate = useNavigate();

  const [academy, setAcademy] = useState<{ id: string; name: string; slug: string; logo_url: string | null } | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingAcad, setLoadingAcad] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 2 (profile) state
  const [step, setStep] = useState<"auth" | "profile">("auth");
  const [pBelt, setPBelt] = useState<Belt>("branca");
  const [pWeight, setPWeight] = useState("");
  const [pBirth, setPBirth] = useState("");
  const [pPhone, setPPhone] = useState("");
  const [pPlanId, setPPlanId] = useState<string>("");
  const [pAvatar, setPAvatar] = useState<File | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: a, error }, { data: pl }] = await Promise.all([
        supabase.rpc("get_academy_by_invite", { p_token: token }),
        supabase.rpc("get_plans_by_invite", { p_token: token }),
      ]);
      if (error || !a || a.length === 0) {
        setAcademy(null);
      } else {
        setAcademy(a[0]);
      }
      setPlans((pl as Plan[]) ?? []);
      setLoadingAcad(false);
      const { data: s } = await supabase.auth.getSession();
      setHasSession(!!s.session);
      if (s.session) setStep("profile");
    })();
  }, [token]);

  async function submitProfile() {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Sessão inválida");

      let avatar_url: string | null = null;
      if (pAvatar) {
        const ext = pAvatar.name.split(".").pop() ?? "jpg";
        const path = `${uid}/avatar.${ext}`;
        const up = await supabase.storage.from("avatars").upload(path, pAvatar, {
          contentType: pAvatar.type,
          upsert: true,
        });
        if (up.error) throw up.error;
        const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365);
        avatar_url = signed?.signedUrl ?? null;
      }

      const selectedPlan = plans.find((p) => p.id === pPlanId);
      const patch: {
        full_name?: string;
        belt: Belt;
        weight_kg: number | null;
        birth_date: string | null;
        phone: string | null;
        plan_id: string | null;
        monthly_fee?: number;
        due_day?: number;
        avatar_url?: string;
      } = {
        full_name: fullName || undefined,
        belt: pBelt,
        weight_kg: pWeight ? Number(pWeight) : null,
        birth_date: pBirth || null,
        phone: pPhone || null,
        plan_id: pPlanId || null,
      };
      if (selectedPlan) {
        patch.monthly_fee = selectedPlan.amount;
        patch.due_day = selectedPlan.due_day;
      }
      if (avatar_url) patch.avatar_url = avatar_url;

      const { error: upErr } = await supabase.from("profiles").update(patch).eq("id", uid);
      if (upErr) throw upErr;

      const { error: joinErr } = await supabase.rpc("join_academy_by_token", { p_token: token });
      if (joinErr) throw joinErr;

      toast.success("Solicitação enviada! Aguarde a aprovação do professor.");
      navigate({ to: "/aluno" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
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
        let hasActiveSession = false;
        const { data: s } = await supabase.auth.getSession();
        if (s.session) {
          hasActiveSession = true;
        } else {
          const { data: signIn } = await supabase.auth.signInWithPassword({ email: emailOk, password: passwordOk });
          if (signIn.session) hasActiveSession = true;
        }
        if (hasActiveSession) {
          setHasSession(true);
          setStep("profile");
        } else {
          toast.success("Conta criada! Confirme seu e-mail e volte ao link do convite.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: emailOk, password: passwordOk });
        if (error) throw error;
        // pre-fill name from profile
        const { data: u } = await supabase.auth.getUser();
        if (u.user) {
          const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", u.user.id).maybeSingle();
          if (prof?.full_name) setFullName(prof.full_name);
        }
        setHasSession(true);
        setStep("profile");
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
      setHasSession(true);
      setStep("profile");
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

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            {academy.logo_url ? (
              <img
                src={academy.logo_url}
                alt={academy.name}
                className="size-20 sm:size-24 mx-auto rounded-full object-cover border border-border bg-surface mb-4"
              />
            ) : (
              <div className="size-20 sm:size-24 mx-auto rounded-full border border-border bg-surface mb-4 grid place-items-center font-display text-brand text-2xl">
                {academy.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-[10px] uppercase tracking-widest text-brand font-bold">Convite</span>
            <h1 className="font-display text-2xl sm:text-3xl uppercase mt-2 mb-2">{academy.name}</h1>
            <p className="text-white/50 text-xs sm:text-sm">
              {step === "auth"
                ? "Crie sua conta para entrar. Sua solicitação ficará pendente até o professor aprovar."
                : "Complete seu perfil de aluno."}
            </p>
          </div>

          {step === "auth" && !hasSession && (
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
                  {loading ? "Aguarde..." : mode === "signup" ? "Criar conta" : "Entrar"}
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

          {step === "profile" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitProfile();
              }}
              className="space-y-4"
            >
              <Field label="Nome completo" value={fullName} onChange={setFullName} type="text" />

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">Faixa</span>
                  <select
                    value={pBelt}
                    onChange={(e) => setPBelt(e.target.value as Belt)}
                    className="w-full h-12 px-3 bg-surface border border-border text-sm capitalize"
                  >
                    {BELTS.map((b) => (
                      <option key={b} value={b} className="capitalize">{b}</option>
                    ))}
                  </select>
                </label>
                <Field label="Peso (kg)" value={pWeight} onChange={setPWeight} type="number" required={false} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Nascimento" value={pBirth} onChange={setPBirth} type="date" required={false} />
                <Field label="Telefone" value={pPhone} onChange={setPPhone} type="tel" required={false} />
              </div>

              <label className="block">
                <span className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">Foto de perfil</span>
                <label className="flex items-center gap-2 h-12 px-3 bg-surface border border-border cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  <Upload className="size-4" />
                  <span className="truncate">{pAvatar ? pAvatar.name : "Selecionar imagem (opcional)"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setPAvatar(e.target.files?.[0] ?? null)}
                  />
                </label>
              </label>

              <div>
                <span className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">Plano mensal</span>
                {plans.length === 0 ? (
                  <div className="p-3 bg-surface border border-dashed border-border text-xs text-muted-foreground">
                    Nenhum plano cadastrado ainda. O professor definirá depois.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {plans.map((pl) => (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => setPPlanId(pl.id)}
                        className={`w-full text-left p-3 border transition-colors ${
                          pPlanId === pl.id
                            ? "border-brand bg-brand/10"
                            : "border-border bg-surface hover:bg-surface-2"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold">{pl.name}</div>
                            <div className="text-[11px] text-muted-foreground">Vence dia {pl.due_day}</div>
                          </div>
                          <div className="font-display text-lg">{formatCurrency(pl.amount)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                disabled={loading}
                className="w-full h-12 bg-brand text-brand-foreground font-display uppercase tracking-widest text-sm hover:bg-white disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Solicitar entrada"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({
  label, value, onChange, type, required = true,
}: { label: string; value: string; onChange: (v: string) => void; type: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 px-4 bg-surface border border-border focus:border-brand focus:outline-none text-sm"
      />
    </label>
  );
}
