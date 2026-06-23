import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  DollarSign,
  Award,
  Trophy,
  Camera,
  LogOut,
  Copy,
  Check,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMyAcademy, buildSubdomain, buildInviteUrl } from "@/hooks/use-current-academy";
import { BeltBadge } from "@/components/BeltBadge";
import { toast } from "sonner";

const nav = [
  { to: "/professor", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/professor/alunos", label: "Alunos", icon: Users, exact: false },
  { to: "/professor/calendario", label: "Calendário", icon: CalendarDays, exact: false },
  { to: "/professor/mensalidades", label: "Mensalidades", icon: DollarSign, exact: false },
  { to: "/professor/graduacoes", label: "Graduações", icon: Award, exact: false },
  { to: "/professor/campeonatos", label: "Campeonatos", icon: Trophy, exact: false },
  { to: "/professor/fotos", label: "Foto do Dia", icon: Camera, exact: false },
] as const;

export function ProfessorShell({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { data: me } = useCurrentUser();
  const { data: academy } = useMyAcademy();
  const [copied, setCopied] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    navigate({ to: "/auth" });
  }

  async function copyInvite() {
    if (!academy) return;
    await navigator.clipboard.writeText(buildInviteUrl(academy.invite_token));
    setCopied(true);
    toast.success("Link de convite copiado");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans">
      <aside className="w-64 border-r border-border flex flex-col bg-surface shrink-0">
        <div className="px-6 py-6 border-b border-border">
          <Link to="/" className="text-xl font-display tracking-tighter italic block">
            TATAME<span className="text-brand">OS</span>
          </Link>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
            Área do Professor
          </div>
        </div>

        {academy && (
          <div className="px-4 py-4 border-b border-border space-y-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Academia</div>
              <div className="text-sm font-display truncate">{academy.name}</div>
              <div className="text-[10px] text-brand truncate">{buildSubdomain(academy.slug)}</div>
            </div>
            <button
              onClick={copyInvite}
              className="w-full flex items-center gap-2 px-2 py-2 bg-background border border-border rounded text-[11px] text-muted-foreground hover:text-foreground"
              title="Copiar link de convite"
            >
              {copied ? <Check className="size-3 text-brand" /> : <Copy className="size-3" />}
              <span className="truncate">{copied ? "Copiado!" : "Link de convite"}</span>
            </button>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2"
          >
            <LogOut className="size-4" /> Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-background/60 backdrop-blur sticky top-0 z-10">
          <h1 className="text-xl font-display tracking-tight">{title}</h1>
          <div className="flex items-center gap-3">
            {actions}
            {me?.profile && (
              <div className="flex items-center gap-3 pl-3 border-l border-border">
                <div className="text-right text-xs">
                  <div className="font-semibold">{me.profile.full_name || me.email}</div>
                  <div className="text-muted-foreground capitalize">
                    Faixa {me.profile.belt} · {me.profile.stripes}°
                  </div>
                </div>
                <BeltBadge belt={me.profile.belt} stripes={me.profile.stripes} size="sm" />
              </div>
            )}
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

