import { beltColors, type Belt } from "@/lib/jiujitsu";

export function BeltBadge({
  belt,
  stripes = 0,
  size = "md",
  showLabel = false,
}: {
  belt: Belt;
  stripes?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const h = size === "sm" ? "h-2" : size === "lg" ? "h-4" : "h-3";
  const w = size === "sm" ? "w-16" : size === "lg" ? "w-32" : "w-24";
  const color = beltColors[belt];
  return (
    <div className="inline-flex items-center gap-2">
      <div className={`relative ${w} ${h} rounded-sm`} style={{ background: color.bg }}>
        <div className="absolute right-1 top-0 bottom-0 w-7 bg-black/80 flex items-center justify-center gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`w-0.5 h-full ${i < stripes ? "bg-white" : "bg-white/10"}`} />
          ))}
        </div>
      </div>
      {showLabel && (
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          {color.label} · {stripes}°
        </span>
      )}
    </div>
  );
}
