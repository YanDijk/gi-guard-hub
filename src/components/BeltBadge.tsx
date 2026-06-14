import { beltColors, type Belt } from "@/lib/mock-data";

export function BeltBadge({ belt, stripes = 0, size = "md" }: { belt: Belt; stripes?: number; size?: "sm" | "md" | "lg" }) {
  const h = size === "sm" ? "h-2" : size === "lg" ? "h-4" : "h-3";
  const w = size === "sm" ? "w-16" : size === "lg" ? "w-32" : "w-24";
  return (
    <div className={`relative ${w} ${h} rounded-sm flex items-center justify-end pr-1 gap-0.5`} style={{ background: beltColors[belt].bg }}>
      <div className="absolute right-1 top-0 bottom-0 w-7 bg-black/80 flex items-center justify-center gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`w-0.5 h-full ${i < stripes ? "bg-white" : "bg-white/10"}`} />
        ))}
      </div>
    </div>
  );
}
