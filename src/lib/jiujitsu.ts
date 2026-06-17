import type { Database } from "@/integrations/supabase/types";

export type Belt = Database["public"]["Enums"]["belt"];
export type AppRole = Database["public"]["Enums"]["app_role"];
export type SignupStatus = Database["public"]["Enums"]["signup_status"];

export const BELTS: Belt[] = ["branca", "azul", "roxa", "marrom", "preta", "coral", "vermelha"];

export const beltColors: Record<Belt, { bg: string; label: string; ink: string }> = {
  branca: { bg: "#f5f5f5", label: "Branca", ink: "#111" },
  azul: { bg: "#1d4ed8", label: "Azul", ink: "#fff" },
  roxa: { bg: "#6d28d9", label: "Roxa", ink: "#fff" },
  marrom: { bg: "#78350f", label: "Marrom", ink: "#fff" },
  preta: { bg: "#0a0a0a", label: "Preta", ink: "#fff" },
  coral: { bg: "#ef4444", label: "Coral", ink: "#fff" },
  vermelha: { bg: "#b91c1c", label: "Vermelha", ink: "#fff" },
};

export const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export function formatCurrency(value: number | string | null | undefined) {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

export function monthLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
