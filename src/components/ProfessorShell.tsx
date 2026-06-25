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
  Menu,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMyAcademy, buildSubdomain, buildInviteUrl } from "@/hooks/use-current-academy";
import { BeltBadge } from "@/components/BeltBadge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
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
    <div className="h-full flex flex-col bg-surface">
      <div className="px-6 py-6 border-b border-border">
        <Link to="/" className="text-xl font-display tracking-tighter italic block" onClick={onNavigate}>
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
          >
            {copied ? <Check className="size-3 text-brand" /> : <Copy className="size-3" />}
            <span className="truncate">{copied ? "Copiado!" : "Link de convite"}</span>
          </button>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
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
    </div>
  );
}

export function ProfessorShell({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const { data: me } = useCurrentUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans">
      <aside className="hidden lg:flex w-64 border-r border-border shrink-0">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 lg:h-16 border-b border-border flex items-center justify-between gap-2 px-3 lg:px-8 bg-background/60 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  className="lg:hidden p-2 -ml-2 rounded-md hover:bg-surface-2"
                  aria-label="Abrir menu"
                >
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 bg-surface border-border">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <h1 className="text-base lg:text-xl font-display tracking-tight truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            {actions}
            {me?.profile && (
              <div className="hidden md:flex items-center gap-3 pl-3 border-l border-border">
                <div className="text-right text-xs">
                  <div className="font-semibold truncate max-w-[140px]">{me.profile.full_name || me.email}</div>
                  <div className="text-muted-foreground capitalize">
                    Faixa {me.profile.belt} · {me.profile.stripes}°
                  </div>
                </div>
                <BeltBadge belt={me.profile.belt} stripes={me.profile.stripes} size="sm" />
              </div>
            )}
            {me?.profile && (
              <div className="md:hidden">
                <BeltBadge belt={me.profile.belt} stripes={me.profile.stripes} size="sm" />
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export function ProfessorLayoutRoute() {
  return <Outlet />;
}
