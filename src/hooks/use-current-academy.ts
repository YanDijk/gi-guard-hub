import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMyAcademy() {
  return useQuery({
    queryKey: ["my-academy"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return null;
      const { data } = await supabase
        .from("academies")
        .select("*")
        .eq("owner_id", uid)
        .maybeSingle();
      return data;
    },
  });
}

export function useMyMembership() {
  return useQuery({
    queryKey: ["my-membership"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return null;
      const { data } = await supabase
        .from("academy_memberships")
        .select("*, academies(*)")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });
}

export async function resolveNextDestination(userId: string): Promise<string> {
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (roles?.some((r) => r.role === "professor")) return "/professor";
  const { data: m } = await supabase
    .from("academy_memberships")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (m) return "/aluno";
  return "/onboarding";
}

export function buildSubdomain(slug: string) {
  return `${slug}.tatameos.app`;
}

export function buildInviteUrl(token: string) {
  if (typeof window === "undefined") return `/convite/${token}`;
  return `${window.location.origin}/convite/${token}`;
}
