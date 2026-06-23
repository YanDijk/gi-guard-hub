import { createFileRoute } from "@tanstack/react-router";
import dashboardPreview from "@/assets/dashboard-preview.jpg";
import mobilePreview from "@/assets/mobile-preview.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TatameOS — Gestão profissional para academias de Jiu-Jitsu" },
      {
        name: "description",
        content:
          "Automatize mensalidades, organize graduações e registre presença com IA. A plataforma definitiva para academias de Jiu-Jitsu.",
      },
      { property: "og:title", content: "TatameOS — Gestão profissional para academias de Jiu-Jitsu" },
      {
        property: "og:description",
        content:
          "Automatize mensalidades, organize graduações e registre presença com IA. A plataforma definitiva para academias de Jiu-Jitsu.",
      },
      { property: "og:image", content: dashboardPreview },
      { name: "twitter:image", content: dashboardPreview },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 border-b border-border max-w-7xl mx-auto">
        <a href="#" className="text-2xl font-display tracking-tighter italic">
          TATAME<span className="text-brand">OS</span>
        </a>
        <div className="hidden md:flex gap-8 text-sm font-semibold uppercase tracking-widest text-white/60">
          <a href="#recursos" className="hover:text-brand transition-colors">
            Recursos
          </a>
          <a href="#app" className="hover:text-brand transition-colors">
            Dashboard
          </a>
          <a href="/planos" className="hover:text-brand transition-colors">
            Planos
          </a>
          <a href="/auth" className="hover:text-brand transition-colors">
            Área do Aluno
          </a>
        </div>
        <a
          href="/auth"
          className="bg-brand text-brand-foreground px-5 py-2 text-xs font-display uppercase tracking-wider hover:bg-white transition-all"
        >
          Entrar
        </a>
      </nav>

      {/* Hero */}
      <header className="px-6 pt-20 pb-12 md:flex items-center gap-12 max-w-7xl mx-auto">
        <div className="md:w-1/2">
          <h1 className="font-display text-5xl md:text-7xl uppercase leading-[0.9] mb-6">
            Gerencie sua <span className="text-brand">equipe</span> com força total.
          </h1>
          <p className="text-lg text-white/50 mb-8 max-w-md">
            A plataforma definitiva para academias de Jiu-Jitsu. Do controle de faixas ao reconhecimento facial por IA.
            Menos burocracia, mais rola.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <a
              href="/planos"
              className="bg-brand text-brand-foreground h-14 px-8 inline-flex items-center font-display uppercase tracking-widest hover:translate-x-1 hover:-translate-y-1 transition-transform shadow-[4px_4px_0px_#fff]"
            >
              Começar Agora
            </a>
            <div className="flex items-center gap-3 px-4 py-2 border border-border rounded-sm">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-background" />
                <div className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-background" />
                <div className="w-8 h-8 rounded-full bg-zinc-600 border-2 border-background" />
              </div>
              <span className="text-xs font-bold text-white/40">+500 Professores</span>
            </div>
          </div>
        </div>
        <div className="md:w-1/2 mt-12 md:mt-0 relative">
          <div className="absolute -inset-4 bg-brand/10 blur-3xl rounded-full" aria-hidden />
          <img
            src={dashboardPreview}
            alt="Dashboard do TatameOS mostrando estatísticas de alunos e mensalidades"
            className="relative w-full aspect-[4/3] object-cover bg-surface border border-border rounded-lg shadow-2xl"
            loading="eager"
          />
        </div>
      </header>

      {/* Social Proof */}
      <div className="py-12 border-y border-border bg-white/5 overflow-hidden">
        <div className="flex justify-around items-center opacity-30 grayscale gap-12 whitespace-nowrap px-6">
          <span className="font-display text-xl">GRACIE BARRA</span>
          <span className="font-display text-xl">ALLIANCE</span>
          <span className="font-display text-xl">CHECKMAT</span>
          <span className="font-display text-xl">ATOS</span>
          <span className="font-display text-xl hidden md:inline">GFTEAM</span>
        </div>
      </div>

      {/* Features */}
      <section id="recursos" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-4">
          <h2 className="font-display text-4xl uppercase max-w-xl">
            Tecnologia de elite para quem vive no <span className="text-brand">tatame</span>.
          </h2>
          <p className="text-white/40 max-w-xs text-sm">
            Ferramentas desenhadas especificamente para a rotina de uma escola de lutas.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            title="Presença por IA"
            description="Tire uma foto da turma e a IA identifica automaticamente quem está presente via reconhecimento facial."
            icon={<div className="w-6 h-6 border-2 border-brand" />}
          />
          <FeatureCard
            title="Gestão de Graduação"
            description="Histórico completo de faixas e graus. Marque cerimônias, registre tamanhos de faixa e acompanhe o progresso de cada aluno."
            icon={<div className="w-6 h-6 bg-brand" />}
          />
          <FeatureCard
            title="Mensalidades"
            description="Veja quem está em dia, quem atrasou, histórico de pagamentos e planos mensal, trimestral, semestral ou anual."
            icon={<div className="w-2 h-6 bg-brand rotate-45" />}
          />
          <FeatureCard
            title="Calendário de Aulas"
            description="Configure horários fixos uma vez. O sistema gera as aulas, eventos especiais, seminários e exames de faixa."
            icon={<div className="w-6 h-6 border-2 border-brand rounded-full" />}
          />
          <FeatureCard
            title="Foto do Dia"
            description="Registre fotos, vídeos e observações do treino. Alunos presentes acessam o conteúdo pelo app."
            icon={<div className="w-6 h-6 bg-brand rounded-full" />}
          />
          <FeatureCard
            title="Campeonatos"
            description="Cadastre eventos, marque alunos recomendados, convocados e inscritos. Link direto para inscrição."
            icon={
              <div className="flex gap-1">
                <div className="w-1.5 h-6 bg-brand" />
                <div className="w-1.5 h-6 bg-brand/60" />
                <div className="w-1.5 h-6 bg-brand/30" />
              </div>
            }
          />
        </div>
      </section>

      {/* App Spotlight */}
      <section id="app" className="py-24 bg-brand">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-background p-8 md:p-16 rounded-3xl border border-border">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="flex justify-center">
                <div className="w-full max-w-[320px] aspect-[9/16] bg-surface border border-border rounded-[3rem] p-3">
                  <img
                    src={mobilePreview}
                    alt="App mobile do aluno mostrando progresso de faixa e calendário"
                    className="w-full h-full object-cover rounded-[2.5rem]"
                    loading="lazy"
                  />
                </div>
              </div>
              <div>
                <span className="inline-block px-3 py-1 bg-brand text-brand-foreground text-[10px] font-bold uppercase tracking-widest mb-6">
                  Área do Aluno
                </span>
                <h2 className="font-display text-4xl md:text-5xl uppercase mb-6">
                  Toda a sua academia no <span className="text-brand">bolso</span>.
                </h2>
                <ul className="space-y-4 mb-8">
                  <BulletItem>Confirmação de presença antes do treino (Vou / Talvez / Não vou).</BulletItem>
                  <BulletItem>Feedback individual do professor sobre evolução técnica.</BulletItem>
                  <BulletItem>Acesso a fotos e vídeos dos treinos em que participou.</BulletItem>
                  <BulletItem>Notificações automáticas de mensalidades atrasadas.</BulletItem>
                  <BulletItem>Inscrição em campeonatos internos com um clique.</BulletItem>
                </ul>
                <a
                  href="/planos"
                  className="inline-block border-2 border-brand text-brand px-8 py-4 font-display uppercase tracking-widest hover:bg-brand hover:text-brand-foreground transition-all"
                >
                  Ver Demonstração
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-24 px-6 max-w-7xl mx-auto text-center">
        <h2 className="font-display text-4xl uppercase mb-4">
          Escolha seu <span className="text-brand">plano</span>
        </h2>
        <p className="text-white/40 mb-16 max-w-md mx-auto">
          Comece com 14 dias grátis. Sem cartão de crédito.
        </p>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="p-12 border border-border bg-surface/50 text-left">
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Essencial</span>
            <div className="text-5xl font-display my-4">
              R$149<span className="text-lg text-white/30 tracking-normal">/mês</span>
            </div>
            <p className="text-sm text-white/50 mb-8">Ideal para studios e projetos sociais.</p>
            <ul className="space-y-3 mb-12 text-sm text-white/70">
              <li>✓ Até 100 alunos</li>
              <li>✓ Gestão de mensalidades</li>
              <li>✓ Controle de graduação</li>
              <li>✓ Calendário e presença manual</li>
              <li>✓ Suporte via Email</li>
            </ul>
            <a
              href="/planos"
              className="block w-full py-4 border border-white/20 text-white font-display uppercase tracking-widest hover:bg-white hover:text-brand-foreground transition-all text-center"
            >
              Assinar
            </a>
          </div>
          <div className="p-12 border-2 border-brand bg-surface text-left relative">
            <div className="absolute top-0 right-0 bg-brand text-brand-foreground px-4 py-1 text-[10px] font-bold uppercase">
              Popular
            </div>
            <span className="text-xs font-bold text-brand uppercase tracking-widest">Black Belt</span>
            <div className="text-5xl font-display my-4">
              R$299<span className="text-lg text-white/30 tracking-normal">/mês</span>
            </div>
            <p className="text-sm text-white/50 mb-8">Para academias de alta performance.</p>
            <ul className="space-y-3 mb-12 text-sm text-white/70">
              <li>✓ Alunos ilimitados</li>
              <li>✓ Reconhecimento Facial por IA</li>
              <li>✓ Área do Aluno completa</li>
              <li>✓ Gestão de campeonatos</li>
              <li>✓ Suporte prioritário 24/7</li>
            </ul>
            <a
              href="/planos"
              className="block w-full py-4 bg-brand text-brand-foreground font-display uppercase tracking-widest hover:bg-white transition-all text-center"
            >
              Assinar Agora
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="cta" className="py-24 px-6">
        <div className="max-w-4xl mx-auto bg-brand p-12 text-brand-foreground text-center">
          <h2 className="font-display text-4xl md:text-6xl uppercase mb-8 leading-none">
            Pronto para levar sua academia ao próximo nível?
          </h2>
          <p className="font-bold uppercase tracking-tighter mb-10 opacity-70">
            Teste por 14 dias sem compromisso.
          </p>
          <a
            href="#"
            className="inline-block bg-black text-white px-12 py-5 font-display uppercase tracking-widest hover:scale-105 transition-transform"
          >
            Começar Teste Grátis
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-xl font-display italic tracking-tighter">
            TATAME<span className="text-brand">OS</span>
          </div>
          <div className="text-white/30 text-[10px] uppercase tracking-widest font-medium text-center">
            © 2024 TatameOS Software. Criado por quem rola para quem ensina.
          </div>
          <div className="flex gap-6 text-white/40 text-xs uppercase tracking-widest">
            <a href="#" className="hover:text-brand transition-colors">Termos</a>
            <a href="#" className="hover:text-brand transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-8 bg-surface border border-border hover:border-brand/50 transition-colors">
      <div className="w-12 h-12 bg-brand/10 flex items-center justify-center mb-6">{icon}</div>
      <h3 className="font-display text-xl uppercase mb-4">{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-2 w-1.5 h-1.5 bg-brand shrink-0" />
      <p className="text-white/70">{children}</p>
    </li>
  );
}
