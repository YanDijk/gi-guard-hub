import { createFileRoute, Link } from "@tanstack/react-router";
import { ProfessorShell } from "@/components/ProfessorShell";
import { BeltBadge } from "@/components/BeltBadge";
import { Avatar } from "@/components/Avatar";
import { TrendingUp, Users, DollarSign, Calendar, ArrowUpRight, Award, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DAY_LABELS, formatCurrency, monthKey } from "@/lib/jiujitsu";

export const Route = createFileRoute("/_authenticated/professor/")({
  head: () => ({ meta: [{ title: "Dashboard — TatameOS" }] }),
  component: Dashboard,
});

function Dashboard() {
  const today = new Date();
  const todayDow = today.getDay();
  const todayIso = today.toISOString().slice(0, 10);
  const monthIso = monthKey(today);

  const { data, isLoading } = useQuery({
    queryKey: ["professor-dashboard", monthIso, todayIso],
    queryFn: async () => {
      const [students, classes, payments, graduations, tournaments] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("classes").select("*"),
        supabase.from("payments").select("*").eq("reference_month", monthIso),
        supabase
          .from("graduations")
          .select("*, profiles!inner(full_name)")
          .gte("ceremony_date", todayIso)
          .order("ceremony_date")
          .limit(5),
        supabase
          .from("tournaments")
          .select("*")
          .gte("event_date", todayIso)
          .order("event_date")
          .limit(4),
      ]);

      const allStudents = students.data ?? [];
      const activeStudents = allStudents.filter((s) => s.active);
      const todayClasses = (classes.data ?? [])
        .filter((c) => c.day_of_week === todayDow)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      const paidRows = (payments.data ?? []).filter((p) => p.paid_at);
      const overdueRows = (payments.data ?? []).filter(
        (p) => !p.paid_at && p.due_date < todayIso,
      );

      return {
        activeStudents,
        recentStudents: allStudents.slice(0, 5),
        todayClasses,
        revenue: paidRows.reduce((acc, p) => acc + Number(p.amount), 0),
        overdueCount: overdueRows.length,
        graduations: graduations.data ?? [],
        tournaments: tournaments.data ?? [],
      };
    },
  });

  const stats = [
    {
      label: "Alunos ativos",
      value: data?.activeStudents.length ?? 0,
      icon: Users,
      color: "text-brand",
    },
    {
      label: "Receita do mês",
      value: formatCurrency(data?.revenue ?? 0),
      icon: DollarSign,
      color: "text-brand",
    },
    {
      label: "Inadimplentes",
      value: data?.overdueCount ?? 0,
      icon: TrendingUp,
      color: "text-red-400",
    },
    {
      label: "Aulas hoje",
      value: data?.todayClasses.length ?? 0,
      icon: Calendar,
      color: "text-brand",
    },
  ];

  return (
    <ProfessorShell title="Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-surface border border-border rounded-lg p-4 lg:p-5">
              <div className="flex items-start justify-between mb-2 lg:mb-3 gap-2">
                <div className="text-[10px] lg:text-xs uppercase tracking-widest text-muted-foreground min-w-0 truncate">
                  {s.label}
                </div>
                <Icon className={`size-4 shrink-0 ${s.color}`} />
              </div>
              <div className="text-2xl lg:text-3xl font-display tracking-tight truncate">{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Aulas de hoje" linkTo="/professor/calendario" linkLabel="Ver calendário" className="lg:col-span-2">
          {isLoading ? (
            <Skeleton />
          ) : data?.todayClasses.length === 0 ? (
            <Empty label="Nenhuma aula cadastrada para hoje." cta={{ to: "/professor/calendario", label: "Configurar grade" }} />
          ) : (
            <div className="space-y-2">
              {data?.todayClasses.map((c) => (
                <div key={c.id} className="flex items-center gap-4 p-3 bg-surface-2 rounded-md">
                  <div className="font-display text-xl text-brand w-16">{c.start_time.slice(0, 5)}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.level}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">cap. {c.capacity}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Próximas graduações" icon={Award}>
          {data?.graduations.length === 0 ? (
            <Empty label="Sem cerimônias agendadas." />
          ) : (
            <div className="space-y-3">
              {data?.graduations.map((g) => (
                <div key={g.id} className="flex items-center gap-3">
                  <BeltBadge belt={g.to_belt} stripes={g.to_stripes} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {(g.profiles as { full_name: string } | null)?.full_name ?? "Aluno"}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {g.from_belt} {g.from_stripes}° → {g.to_belt} {g.to_stripes}°
                    </div>
                  </div>
                  <div className="text-xs text-brand font-mono">
                    {new Date(g.ceremony_date).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Alunos recentes" linkTo="/professor/alunos" linkLabel="Ver todos" className="lg:col-span-2">
          {data?.recentStudents.length === 0 ? (
            <Empty label="Nenhum aluno cadastrado ainda." />
          ) : (
            <div className="divide-y divide-border">
              {data?.recentStudents.map((s) => (
                <div key={s.id} className="flex items-center gap-3 py-3 min-w-0">
                  <Avatar name={s.full_name || "Aluno"} url={s.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{s.full_name || "(sem nome)"}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {s.weight_kg ? `${s.weight_kg}kg` : "peso —"} · {DAY_LABELS[new Date(s.created_at).getDay()]}
                    </div>
                  </div>
                  <BeltBadge belt={s.belt} stripes={s.stripes} />
                  <span
                    className={`hidden sm:inline text-[10px] uppercase tracking-widest px-2 py-1 rounded shrink-0 ${
                      s.active ? "bg-brand/10 text-brand" : "bg-white/5 text-muted-foreground"
                    }`}
                  >
                    {s.active ? "ativo" : "inativo"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Campeonatos" linkTo="/professor/campeonatos" linkLabel="Gerenciar" icon={Trophy}>
          {data?.tournaments.length === 0 ? (
            <Empty label="Sem eventos próximos." />
          ) : (
            <div className="space-y-3">
              {data?.tournaments.map((t) => (
                <div key={t.id} className="p-3 bg-surface-2 rounded-md">
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t.city ?? "—"} · {new Date(t.event_date).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </ProfessorShell>
  );
}

function Card({
  title,
  children,
  linkTo,
  linkLabel,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  linkTo?: string;
  linkLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={`bg-surface border border-border rounded-lg p-4 lg:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg">{title}</h2>
        {linkTo && linkLabel && (
          <Link
            to={linkTo}
            className="text-xs text-brand uppercase tracking-widest flex items-center gap-1 hover:underline"
          >
            {linkLabel} <ArrowUpRight className="size-3" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function Empty({ label, cta }: { label: string; cta?: { to: string; label: string } }) {
  return (
    <div className="py-8 text-center text-sm text-muted-foreground">
      <div>{label}</div>
      {cta && (
        <Link to={cta.to} className="inline-block mt-3 text-brand text-xs uppercase tracking-widest hover:underline">
          {cta.label} →
        </Link>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-14 bg-surface-2 rounded-md animate-pulse" />
      ))}
    </div>
  );
}

