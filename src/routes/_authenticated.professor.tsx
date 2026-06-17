import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/professor")({
  component: () => <ProfessorGate />,
});

function ProfessorGate() {
  const { data: me, isLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [claiming, setClaiming] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (!me) {
    navigate({ to: "/auth" });
    return null;
  }

  if (!me.isProfessor) {
    return <ClaimProfessor onClaimed={() => queryClient.invalidateQueries({ queryKey: ["current-user"] })} claiming={claiming} setClaiming={setClaiming} />;
  }

  return <Outlet />;
}

function ClaimProfessor({
  onClaimed,
  claiming,
  setClaiming,
}: {
  onClaimed: () => void;
  claiming: boolean;
  setClaiming: (v: boolean) => void;
}) {
  async function claim() {
    setClaiming(true);
    try {
      const { data, error } = await supabase.rpc("claim_professor");
      if (error) throw error;
      if (data === true) {
        toast.success("Agora você é o professor da academia.");
        onClaimed();
      } else {
        toast.error("Já existe um professor cadastrado. Peça a ele para promover você.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado";
      toast.error(message);
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background px-6">
      <div className="max-w-md w-full bg-surface border border-border rounded-lg p-8 text-center">
        <ShieldCheck className="size-10 text-brand mx-auto mb-4" />
        <h1 className="font-display text-2xl uppercase mb-2">Área do Professor</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Esta área é restrita ao administrador da academia. Se você é o dono, clique abaixo para
          assumir o papel de professor.
        </p>
        <button
          onClick={claim}
          disabled={claiming}
          className="w-full h-11 bg-brand text-brand-foreground font-display uppercase tracking-widest text-sm hover:bg-white transition-colors disabled:opacity-50"
        >
          {claiming ? "Aguarde..." : "Sou o professor desta academia"}
        </button>
        <p className="text-[11px] text-muted-foreground mt-4">
          Apenas o primeiro a clicar é promovido automaticamente.
        </p>
      </div>
    </div>
  );
}
