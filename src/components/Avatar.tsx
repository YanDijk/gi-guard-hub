export function Avatar({ name, url, size = 40 }: { name: string; url?: string | null; size?: number }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <div
      className="rounded-full bg-surface-2 border border-border flex items-center justify-center text-xs font-bold text-foreground shrink-0"
      style={{ width: size, height: size }}
    >
      {initials || "·"}
    </div>
  );
}
