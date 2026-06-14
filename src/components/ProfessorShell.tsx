import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, CalendarDays, DollarSign, Award, Trophy, Camera, LogOut, Bell, Search } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/professor", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/professor/alunos", label: "Alunos", icon: Users },
  { to: "/professor/calendario", label: "Calendário", icon: CalendarDays },
  { to: "/professor/mensalidades", label: "Mensalidades", icon: DollarSign },
  { to: "/professor/graduacoes", label: "Graduações", icon: Award },
  { to: "/professor/campeonatos", label: "Campeonatos", icon: Trophy },
  { to: "/professor/fotos", label: "Foto do Dia", icon: Camera },
] as const;

export function ProfessorShell({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans">
      <aside className="w-64 border-r border-border flex flex-col bg-surface shrink-0">
        <div className="px-6 py-6 border-b border-border">
          <Link to="/" className="text-xl font-display tracking-tighter italic block">
            TATAME<span className="text-brand">OS</span>
          </Link>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Área do Professor</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2">
            <LogOut className="size-4" /> Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-background/60 backdrop-blur sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-display tracking-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Buscar aluno..."
                className="h-9 pl-9 pr-3 bg-surface border border-border rounded-md text-sm w-64 focus:outline-none focus:border-brand"
              />
            </div>
            <button className="size-9 rounded-md bg-surface border border-border flex items-center justify-center hover:border-brand">
              <Bell className="size-4" />
            </button>
            {actions}
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <img src="https://i.pravatar.cc/64?img=12" className="size-8 rounded-full object-cover" alt="" />
              <div className="text-xs">
                <div className="font-semibold">Prof. Marcos</div>
                <div className="text-muted-foreground">Faixa Preta · 3º grau</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export function ProfessorLayoutRoute() {
  return <Outlet />;
}
