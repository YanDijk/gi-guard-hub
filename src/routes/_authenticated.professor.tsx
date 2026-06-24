import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMyAcademy } from "@/hooks/use-current-academy";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/professor")({
  component: ProfessorGate,
});

function ProfessorGate() {
  const { data: me, isLoading: meLoading } = useCurrentUser();
  const { data: academy, isLoading: acadLoading, isFetching: acadFetching } = useMyAcademy();
  const navigate = useNavigate();

  useEffect(() => {
    if (meLoading || acadLoading || acadFetching) return;
    if (!me) {
      navigate({ to: "/auth" });
      return;
    }
    if (!academy) {
      navigate({ to: "/onboarding" });
    }
  }, [me, meLoading, academy, acadLoading, acadFetching, navigate]);

  if (meLoading || acadLoading || acadFetching || !academy) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return <Outlet />;
}
