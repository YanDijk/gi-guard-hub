import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos — TatameOS" },
      { name: "description", content: "Escolha o plano ideal para a sua academia de Jiu-Jitsu." },
      { property: "og:title", content: "Planos — TatameOS" },
      { property: "og:description", content: "Starter, Pro ou Elite. Comece em minutos." },
    ],
  }),
  component: PlanosPage,
});

export const PLANS = [
  {
    id: "starter" as const,
    name: "Starter",
    price: "R$ 0",
    period: "/mês",
    tag: "Grátis para começar",
    blurb: "Para academias começando agora.",
    features: ["Até 30 alunos", "Mensalidades e graduações", "Calendário e presença manual", "1 unidade"],
    highlight: false,
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "R$ 149",
    period: "/mês",
    tag: "Mais popular",
    blurb: "Para escolas em crescimento.",
    features: ["Até 100 alunos", "Convites por link", "Foto do dia + galeria", "Até 2 filiais", "Suporte prioritário"],
    highlight: true,
  },
  {
    id: "elite" as const,
    name: "Elite",
    price: "R$ 299",
    period: "/mês",
    tag: "Para times de alta performance",
    blurb: "Federações, equipes e múltiplas unidades.",
    features: ["Alunos ilimitados", "Filiais ilimitadas", "Reconhecimento facial", "Campeonatos avançados", "Suporte 24/7"],
    highlight: false,
  },
];

function PlanosPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="text-2xl font-display tracking-tighter italic">
            TATAME<span className="text-brand">OS</span>
          </Link>
          <Link to="/auth" className="text-xs uppercase tracking-widest text-white/50 hover:text-brand">
            Entrar
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <span className="inline-block px-3 py-1 bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-widest mb-6">
          Planos
        </span>
        <h1 className="font-display text-5xl md:text-6xl uppercase mb-4">
          Escolha o plano da sua <span className="text-brand">academia</span>
        </h1>
        <p className="text-white/50 max-w-xl mx-auto mb-16">
          Crie a página da sua academia em minutos, com subdomínio próprio e link de convite para alunos.
        </p>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={`p-8 border ${p.highlight ? "border-brand bg-surface" : "border-border bg-surface/50"} relative flex flex-col`}
            >
              {p.highlight && (
                <div className="absolute top-0 right-0 bg-brand text-brand-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                  Popular
                </div>
              )}
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                {p.tag}
              </span>
              <h2 className="font-display text-3xl uppercase mt-2">{p.name}</h2>
              <div className="text-4xl font-display mt-4 mb-2">
                {p.price}
                <span className="text-base text-white/30 tracking-normal">{p.period}</span>
              </div>
              <p className="text-sm text-white/50 mb-6">{p.blurb}</p>
              <ul className="space-y-2 mb-8 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                    <Check className="size-4 text-brand mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() =>
                  navigate({ to: "/auth", search: { redirect: `/onboarding?plan=${p.id}` } as never })
                }
                className={`w-full h-12 font-display uppercase tracking-widest text-sm transition-colors ${
                  p.highlight
                    ? "bg-brand text-brand-foreground hover:bg-white"
                    : "border border-white/20 text-white hover:bg-white hover:text-brand-foreground"
                }`}
              >
                Criar academia
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-white/30 mt-10">
          Sem cobrança nesta versão de demonstração. Você poderá trocar de plano depois.
        </p>
      </section>
    </div>
  );
}
