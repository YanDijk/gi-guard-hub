import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bell, CheckCircle2, Trophy, LogOut, Loader2, Camera, Clock, MessageSquare, Download } from "lucide-react";
import { useEffect, useMemo, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMyMembership } from "@/hooks/use-current-academy";
import { BeltBadge } from "@/components/BeltBadge";
import { Avatar } from "@/components/Avatar";
import { DAY_LABELS, formatCurrency } from "@/lib/jiujitsu";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/aluno")({
  head: () => ({ meta: [{ title: "Área do Aluno — TatameOS" }] }),
  component: Aluno,
});

const GRAD_TARGET = 16; // presenças em 30 dias

function Aluno() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: me, isLoading: meLoading } = useCurrentUser();
  const { data: membership, isLoading: memLoading } = useMyMembership();
  const userId = me?.userId;

  useEffect(() => {
    if (meLoading || memLoading) return;
    if (me && !me.isProfessor && !membership) {
      navigate({ to: "/onboarding" });
    }
  }, [me, meLoading, membership, memLoading, navigate]);

  const today = new Date();
  const todayDow = today.getDay();
  const todayIso = today.toISOString().slice(0, 10);
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: classes = [] } = useQuery({
    queryKey: ["aluno-classes"],
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

  const { data: attendances = [] } = useQuery({
    enabled: !!userId,
    queryKey: ["aluno-attendances", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendances")
        .select("*")
        .eq("student_id", userId!)
        .gte("attended_on", since30)
        .order("attended_on", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: currentPayment } = useQuery({
    enabled: !!userId,
    queryKey: ["aluno-payment", userId, monthStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("student_id", userId!)
        .eq("reference_month", monthStart)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: tournaments = [] } = useQuery({
    queryKey: ["aluno-tournaments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .gte("event_date", todayIso)
        .order("event_date");
      if (error) throw error;
      return data;
    },
  });

  const { data: mySignups = [] } = useQuery({
    enabled: !!userId,
    queryKey: ["aluno-signups", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_signups")
        .select("*")
        .eq("student_id", userId!);
      if (error) throw error;
      return data;
    },
  });

  const { data: todayRsvps = [] } = useQuery({
    enabled: !!userId,
    queryKey: ["aluno-rsvps", userId, todayIso],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("class_rsvps")
        .select("*")
        .eq("student_id", userId!)
        .eq("class_date", todayIso);
      return data ?? [];
    },
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["aluno-photos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_photos")
        .select("*")
        .order("taken_on", { ascending: false })
        .limit(9);
      if (error) throw error;
      if (!data?.length) return [];
      const { data: signed } = await supabase.storage
        .from("training-photos")
        .createSignedUrls(data.map((p) => p.photo_path), 3600);
      const map = new Map(signed?.map((s) => [s.path, s.signedUrl]) ?? []);
      return data.map((p) => ({ ...p, url: map.get(p.photo_path) ?? "" }));
    },
  });

  const { data: nextGraduation } = useQuery({
    queryKey: ["aluno-next-grad"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("graduations")
        .select("ceremony_date")
        .gte("ceremony_date", todayIso)
        .order("ceremony_date")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: feedback = [] } = useQuery({
    enabled: !!userId,
    queryKey: ["aluno-feedback", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_feedback")
        .select("id, body, created_at")
        .eq("student_id", userId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const { data: myPlan } = useQuery({
    enabled: !!me?.profile?.plan_id,
    queryKey: ["aluno-plan", me?.profile?.plan_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_plans")
        .select("name, amount, due_day")
        .eq("id", me!.profile!.plan_id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const todayClasses = useMemo(
    () => classes.filter((c) => c.day_of_week === todayDow),
    [classes, todayDow],
  );
  const attendedTodayClassIds = useMemo(
    () => new Set(attendances.filter((a) => a.attended_on === todayIso).map((a) => a.class_id)),
    [attendances, todayIso],
  );
  const signupByTournament = useMemo(
    () => new Map(mySignups.map((s) => [s.tournament_id, s])),
    [mySignups],
  );
  const rsvpByClass = useMemo(
    () => new Map(todayRsvps.map((r: any) => [r.class_id, r])),
    [todayRsvps],
  );

  const toggleRsvp = useMutation({
    mutationFn: async (classId: string) => {
      if (!userId) throw new Error("Sem sessão");
      const existing: any = rsvpByClass.get(classId);
      if (existing) {
        const { error } = await (supabase as any).from("class_rsvps").delete().eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("class_rsvps").insert({
          student_id: userId, class_id: classId, class_date: todayIso, status: "going",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aluno-rsvps"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
  });


  const checkInMutation = useMutation({
    mutationFn: async (classId: string) => {
      if (!userId) throw new Error("Sem sessão");
      const { error } = await supabase.from("attendances").insert({
        student_id: userId,
        class_id: classId,
        attended_on: todayIso,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Presença confirmada");
      queryClient.invalidateQueries({ queryKey: ["aluno-attendances"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
  });

  const signupMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      if (!userId) throw new Error("Sem sessão");
      const { error } = await supabase
        .from("tournament_signups")
        .insert({ tournament_id: tournamentId, student_id: userId, status: "inscrito" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Inscrição registrada");
      queryClient.invalidateQueries({ queryKey: ["aluno-signups"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
  });

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }


  if (meLoading || memLoading || !me?.profile) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (membership && membership.status !== "active") {
    const acad = (membership as { academies?: { name?: string } }).academies;
    return (
      <div className="min-h-screen grid place-items-center bg-background text-foreground px-6">
        <div className="max-w-md w-full bg-surface border border-border rounded-lg p-8 text-center">
          <Clock className="size-10 text-brand mx-auto mb-4" />
          <h1 className="font-display text-2xl uppercase mb-2">
            {membership.status === "pending" ? "Aguardando aprovação" : "Solicitação recusada"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {membership.status === "pending"
              ? `Sua solicitação para entrar em ${acad?.name ?? "academia"} foi enviada. Avise seu professor para aprovar.`
              : `Sua solicitação para ${acad?.name ?? "esta academia"} foi recusada. Fale com seu professor.`}
          </p>
          <button
            onClick={handleLogout}
            className="w-full h-11 border border-border text-muted-foreground hover:text-foreground font-display uppercase tracking-widest text-xs"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  const profile = me.profile;
  const attendance30d = attendances.length;
  const gradProgress = Math.min(100, Math.round((attendance30d / GRAD_TARGET) * 100));
  const gradRemaining = Math.max(0, GRAD_TARGET - attendance30d);

  const paymentStatus = currentPayment?.paid_at
    ? "pago"
    : currentPayment
      ? new Date(currentPayment.due_date) < today
        ? "atrasado"
        : "em aberto"
      : "sem cobrança";

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="max-w-md mx-auto pb-12 px-4 pt-6">
        <header className="flex items-center justify-between mb-6">
          <Link to="/" className="text-xl font-display tracking-tighter italic">
            TATAME<span className="text-brand">OS</span>
          </Link>
          <div className="flex items-center gap-2">
            <button className="size-10 rounded-full bg-surface border border-border grid place-items-center relative">
              <Bell className="size-4" />
            </button>
            <button
              onClick={handleLogout}
              className="size-10 rounded-full bg-surface border border-border grid place-items-center text-muted-foreground hover:text-foreground"
              aria-label="Sair"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </header>

        <div className="bg-gradient-to-br from-brand/20 via-surface to-surface-2 rounded-2xl p-4 sm:p-6 border border-border">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Avatar name={profile.full_name || me.email} url={profile.avatar_url} size={56} />
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Olá</div>
              <div className="text-lg sm:text-xl font-display truncate">{profile.full_name || me.email}</div>
              <div className="mt-2">
                <BeltBadge belt={profile.belt} stripes={profile.stripes} size="lg" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5">
            <Stat label="Presenças 30d" value={attendance30d} />
            <Stat label="Próximo grau" value={`${gradProgress}%`} />
            <Stat label="Aulas hoje" value={todayClasses.length} />
          </div>
        </div>

        <Section title="Aulas de hoje">
          {todayClasses.length === 0 ? (
            <Empty>Sem aulas hoje ({DAY_LABELS[todayDow]}).</Empty>
          ) : (
            <div className="space-y-2">
              {todayClasses.map((c) => {
                const done = attendedTodayClassIds.has(c.id);
                return (
                  <div key={c.id} className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg min-w-0">
                    <div className="font-display text-lg text-brand w-12 shrink-0">{c.start_time.slice(0, 5)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.level} · {c.duration_min}min</div>
                    </div>
                    <button
                      onClick={() => !done && checkInMutation.mutate(c.id)}
                      disabled={done || checkInMutation.isPending}
                      className={`h-9 px-3 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 ${
                        done
                          ? "bg-brand/20 text-brand cursor-default"
                          : "bg-brand text-brand-foreground hover:bg-brand/90"
                      }`}
                    >
                      <CheckCircle2 className="size-4" />
                      <span>{done ? "Presente" : "Check-in"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="Próxima graduação">
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {gradRemaining > 0 ? "Faltam" : "Pronto!"}
                </div>
                <div className="font-display text-2xl">
                  {gradRemaining > 0 ? `${gradRemaining} presenças` : "Aguarde cerimônia"}
                </div>
              </div>
              <BeltBadge belt={profile.belt} stripes={Math.min(4, profile.stripes + 1)} size="lg" />
            </div>
            <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
              <div className="h-full bg-brand transition-all" style={{ width: `${gradProgress}%` }} />
            </div>
            {nextGraduation && (
              <div className="text-xs text-muted-foreground mt-2">
                Próxima cerimônia: {new Date(nextGraduation.ceremony_date).toLocaleDateString("pt-BR")}
              </div>
            )}
          </div>
        </Section>

        <Section title="Mensalidade">
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {today.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                </div>
                <div className="font-display text-2xl">
                  {formatCurrency(currentPayment?.amount ?? profile.monthly_fee ?? 0)}
                </div>
                {currentPayment?.due_date && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Vence em {new Date(currentPayment.due_date).toLocaleDateString("pt-BR")}
                  </div>
                )}
              </div>
              <PaymentBadge status={paymentStatus} />
            </div>
            {myPlan && (
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Plano</span>
                <span className="font-semibold">{myPlan.name}</span>
              </div>
            )}
          </div>
        </Section>

        <Section title="Feedback do sensei">
          {feedback.length === 0 ? (
            <Empty>
              <MessageSquare className="size-4 inline mr-2" />
              Sem feedbacks ainda.
            </Empty>
          ) : (
            <div className="space-y-2">
              {feedback.map((f) => (
                <div key={f.id} className="bg-surface border border-border rounded-xl p-4">
                  <div className="text-[10px] uppercase tracking-widest text-brand mb-1">
                    {new Date(f.created_at).toLocaleDateString("pt-BR")}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{f.body}</div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Campeonatos">
          {tournaments.length === 0 ? (
            <Empty>Nenhum campeonato anunciado.</Empty>
          ) : (
            <div className="space-y-3">
              {tournaments.map((t) => {
                const signed = signupByTournament.get(t.id);
                return (
                  <div key={t.id} className="bg-surface border border-border rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-lg bg-brand/10 grid place-items-center shrink-0">
                        <Trophy className="size-5 text-brand" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{t.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.city} · {new Date(t.event_date).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                      {signed ? (
                        <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-brand/10 text-brand self-center">
                          {signed.status}
                        </span>
                      ) : (
                        <button
                          onClick={() => signupMutation.mutate(t.id)}
                          disabled={signupMutation.isPending}
                          className="h-8 px-3 bg-brand text-brand-foreground rounded-md text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                        >
                          Inscrever
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="Fotos do treino">
          {photos.length === 0 ? (
            <Empty>
              <Camera className="size-4 inline mr-2" />
              Nenhuma foto ainda.
            </Empty>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p) => (
                <a
                  key={p.id}
                  href={p.url || "#"}
                  download={`tatame-${p.taken_on}.jpg`}
                  target="_blank"
                  rel="noopener"
                  className="aspect-square rounded-lg overflow-hidden bg-surface border border-border relative group block"
                >
                  {p.url && <img src={p.url} alt={p.caption ?? ""} className="w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                    <Download className="size-5 text-white" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-black/30 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-lg mt-1">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-1">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="text-center py-6 border border-dashed border-border rounded-lg text-xs text-muted-foreground">
      {children}
    </div>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pago: "bg-brand/10 text-brand",
    "em aberto": "bg-amber-500/10 text-amber-400",
    atrasado: "bg-red-500/10 text-red-400",
    "sem cobrança": "bg-surface-2 text-muted-foreground",
  };
  return (
    <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded ${map[status]}`}>
      {status}
    </span>
  );
}
