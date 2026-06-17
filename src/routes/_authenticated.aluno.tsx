import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { Home, Calendar, Trophy, User, Bell, Camera, CheckCircle2, MessageSquare } from "lucide-react";
import { BeltBadge } from "@/components/BeltBadge";
import { currentStudent, todayClasses, tournaments, graduations } from "@/lib/mock-data";
import type { ReactNode } from "react";

export const Route = createFileRoute("/_authenticated/aluno")({
  head: () => ({ meta: [{ title: "Área do Aluno — TatameOS" }] }),
  component: Aluno,
});

function Aluno() {
  return (
    <AlunoShell>
      <div className="bg-gradient-to-br from-brand/20 via-surface to-surface-2 rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-4">
          <img src={currentStudent.avatar} className="size-16 rounded-full object-cover ring-2 ring-brand" alt="" />
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Olá</div>
            <div className="text-xl font-display">{currentStudent.name}</div>
            <div className="mt-2"><BeltBadge belt={currentStudent.belt} stripes={currentStudent.stripes} size="lg" /></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <Stat label="Presenças (30d)" value={currentStudent.attendance30d} />
          <Stat label="Próximo grau" value="65%" />
          <Stat label="Sequência" value="12 dias" />
        </div>
      </div>

      <Section title="Aula de hoje">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="font-display text-3xl text-brand">{todayClasses[2].time}</div>
            <div className="flex-1">
              <div className="font-bold">{todayClasses[2].name}</div>
              <div className="text-xs text-muted-foreground">{todayClasses[2].confirmed}/{todayClasses[2].capacity} confirmados</div>
            </div>
          </div>
          <button className="w-full h-12 mt-4 bg-brand text-brand-foreground rounded-lg font-bold uppercase tracking-wider flex items-center justify-center gap-2">
            <CheckCircle2 className="size-5" /> Confirmar presença
          </button>
        </div>
      </Section>

      <Section title="Próximos treinos">
        <div className="space-y-2">
          {todayClasses.map((c) => (
            <div key={c.id} className="flex items-center gap-4 p-3 bg-surface border border-border rounded-lg">
              <div className="font-display text-lg text-brand w-14">{c.time}</div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.level}</div>
              </div>
              <button className="size-8 rounded-full bg-surface-2 hover:bg-brand hover:text-brand-foreground flex items-center justify-center transition-colors">
                <CheckCircle2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Sua próxima graduação">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Faltam</div>
              <div className="font-display text-2xl">5 presenças</div>
            </div>
            <BeltBadge belt={currentStudent.belt} stripes={currentStudent.stripes + 1} size="lg" />
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div className="h-full bg-brand" style={{ width: "65%" }} />
          </div>
          <div className="text-xs text-muted-foreground mt-2">Próxima cerimônia: {new Date(graduations[0].date).toLocaleDateString("pt-BR")}</div>
        </div>
      </Section>

      <Section title="Campeonatos · Convocações">
        <div className="space-y-3">
          {tournaments.slice(0, 2).map((t) => (
            <div key={t.id} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                  <Trophy className="size-5 text-brand" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.city} · {new Date(t.date).toLocaleDateString("pt-BR")}</div>
                </div>
                <button className="h-8 px-3 bg-brand text-brand-foreground rounded-md text-xs font-bold uppercase tracking-wider">Inscrever</button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Mensalidade">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Junho · 2026</div>
              <div className="font-display text-2xl">R$ {currentStudent.monthlyFee.toFixed(2)}</div>
            </div>
            <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-brand/10 text-brand">Pago</span>
          </div>
          <button className="w-full h-10 mt-4 border border-border rounded-md text-xs uppercase tracking-widest hover:border-brand">Ver recibos</button>
        </div>
      </Section>

      <Section title="Feedback ao professor">
        <button className="w-full bg-surface border border-border rounded-xl p-5 flex items-center gap-3 hover:border-brand">
          <MessageSquare className="size-5 text-brand" />
          <div className="text-left flex-1">
            <div className="text-sm font-semibold">Como foi seu treino?</div>
            <div className="text-xs text-muted-foreground">Mande feedback direto pro Prof. Marcos</div>
          </div>
        </button>
      </Section>

      <Section title="Fotos do treino">
        <div className="grid grid-cols-3 gap-2">
          {["1517438476312-10d79c077509", "1554068865-24cecd4e34b8", "1571019613454-1cb2f99b2d8b", "1583454110551-21f2fa2afe61", "1555597673-b21d5c935865", "1599058917212-d750089bc07e"].map((p) => (
            <div key={p} className="aspect-square rounded-lg overflow-hidden">
              <img src={`https://images.unsplash.com/photo-${p}?w=300&h=300&fit=crop`} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </Section>

      <div className="h-20" />
    </AlunoShell>
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

function AlunoShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tabs = [
    { to: "/aluno", icon: Home, label: "Início" },
    { to: "/aluno", icon: Calendar, label: "Agenda" },
    { to: "/aluno", icon: Camera, label: "Fotos" },
    { to: "/aluno", icon: Trophy, label: "Eventos" },
    { to: "/aluno", icon: User, label: "Perfil" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="max-w-md mx-auto pb-20 px-4 pt-6">
        <header className="flex items-center justify-between mb-6">
          <Link to="/" className="text-xl font-display tracking-tighter italic">
            TATAME<span className="text-brand">OS</span>
          </Link>
          <button className="size-10 rounded-full bg-surface border border-border flex items-center justify-center relative">
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-2 bg-brand rounded-full" />
          </button>
        </header>
        {children}
      </div>

      <nav className="fixed bottom-0 inset-x-0 bg-surface/95 backdrop-blur border-t border-border">
        <div className="max-w-md mx-auto grid grid-cols-5">
          {tabs.map((t, i) => {
            const Icon = t.icon;
            const active = i === 0 && pathname === "/aluno";
            return (
              <button key={i} className={`py-3 flex flex-col items-center gap-1 ${active ? "text-brand" : "text-muted-foreground"}`}>
                <Icon className="size-5" />
                <span className="text-[10px] uppercase tracking-widest">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
