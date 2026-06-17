import { createFileRoute, Link } from "@tanstack/react-router";
import { ProfessorShell } from "@/components/ProfessorShell";
import { BeltBadge } from "@/components/BeltBadge";
import { students, todayClasses, graduations, tournaments } from "@/lib/mock-data";
import { TrendingUp, Users, DollarSign, Calendar, ArrowUpRight, Scan } from "lucide-react";

export const Route = createFileRoute("/_authenticated/professor/")({
  head: () => ({ meta: [{ title: "Dashboard — TatameOS" }] }),
  component: Dashboard,
});

function Dashboard() {
  const active = students.filter((s) => s.status === "ativo").length;
  const overdue = students.filter((s) => s.status === "inadimplente").length;
  const revenue = students.filter((s) => s.paid).reduce((a, s) => a + s.monthlyFee, 0);

  const stats = [
    { label: "Alunos ativos", value: active, delta: "+3 este mês", icon: Users, color: "text-brand" },
    { label: "Receita do mês", value: `R$ ${revenue.toLocaleString("pt-BR")}`, delta: "+12%", icon: DollarSign, color: "text-brand" },
    { label: "Inadimplentes", value: overdue, delta: "-1 vs mês passado", icon: TrendingUp, color: "text-red-400" },
    { label: "Aulas hoje", value: todayClasses.length, delta: "46 confirmados", icon: Calendar, color: "text-brand" },
  ];

  return (
    <ProfessorShell title="Dashboard"
      actions={
        <button className="h-9 px-4 bg-brand text-brand-foreground rounded-md text-sm font-bold uppercase tracking-wider hover:bg-brand/90 flex items-center gap-2">
          <Scan className="size-4" /> Abrir Check-in IA
        </button>
      }
    >
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-surface border border-border rounded-lg p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
                <Icon className={`size-4 ${s.color}`} />
              </div>
              <div className="text-3xl font-display tracking-tight">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-2">{s.delta}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-surface border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg">Aulas de hoje</h2>
            <Link to="/professor/calendario" className="text-xs text-brand uppercase tracking-widest flex items-center gap-1 hover:underline">
              Ver calendário <ArrowUpRight className="size-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {todayClasses.map((c) => (
              <div key={c.id} className="flex items-center gap-4 p-3 bg-surface-2 rounded-md">
                <div className="font-display text-xl text-brand w-16">{c.time}</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.level}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{c.confirmed}/{c.capacity}</div>
                  <div className="text-xs text-muted-foreground">confirmados</div>
                </div>
                <button className="h-8 px-3 text-xs border border-border rounded-md hover:border-brand uppercase tracking-wider">
                  Iniciar
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="font-display text-lg mb-4">Próximas graduações</h2>
          <div className="space-y-3">
            {graduations.map((g) => (
              <div key={g.id} className="flex items-center gap-3">
                <img src={`https://i.pravatar.cc/40?img=${g.id.charCodeAt(1) + 10}`} className="size-10 rounded-full" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{g.name}</div>
                  <div className="text-xs text-muted-foreground">{g.from} → {g.to}</div>
                </div>
                <div className="text-xs text-brand font-mono">{new Date(g.date).toLocaleDateString("pt-BR")}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 bg-surface border border-border rounded-lg p-6">
          <h2 className="font-display text-lg mb-4">Alunos recentes</h2>
          <div className="divide-y divide-border">
            {students.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center gap-4 py-3">
                <img src={s.avatar} className="size-10 rounded-full object-cover" alt="" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.attendance30d} presenças · {s.weight}kg</div>
                </div>
                <BeltBadge belt={s.belt} stripes={s.stripes} />
                <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded ${
                  s.status === "ativo" ? "bg-brand/10 text-brand" : s.status === "inadimplente" ? "bg-red-500/10 text-red-400" : "bg-white/5 text-muted-foreground"
                }`}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="font-display text-lg mb-4">Campeonatos</h2>
          <div className="space-y-3">
            {tournaments.map((t) => (
              <div key={t.id} className="p-3 bg-surface-2 rounded-md">
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{t.city} · {new Date(t.date).toLocaleDateString("pt-BR")}</div>
                <div className="text-xs text-brand mt-2">{t.registered} inscritos</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProfessorShell>
  );
}
