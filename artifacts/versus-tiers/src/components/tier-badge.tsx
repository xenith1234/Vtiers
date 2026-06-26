const TIER_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  HT5: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/50", glow: "shadow-yellow-500/30" },
  HT4: { bg: "bg-yellow-500/20", text: "text-yellow-300", border: "border-yellow-400/50", glow: "shadow-yellow-400/30" },
  HT3: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/50", glow: "shadow-cyan-500/30" },
  HT2: { bg: "bg-cyan-500/15", text: "text-cyan-300", border: "border-cyan-400/40", glow: "shadow-cyan-400/20" },
  HT1: { bg: "bg-cyan-500/10", text: "text-cyan-200", border: "border-cyan-300/30", glow: "shadow-cyan-300/20" },
  LT5: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/50", glow: "shadow-purple-500/30" },
  LT4: { bg: "bg-purple-500/15", text: "text-purple-300", border: "border-purple-400/40", glow: "shadow-purple-400/20" },
  LT3: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-400/40", glow: "shadow-blue-400/20" },
  LT2: { bg: "bg-gray-500/15", text: "text-gray-400", border: "border-gray-500/40", glow: "" },
  LT1: { bg: "bg-gray-500/10", text: "text-gray-500", border: "border-gray-600/30", glow: "" },
  UR:  { bg: "bg-gray-800/50", text: "text-gray-500", border: "border-gray-700/40", glow: "" },
};

interface TierBadgeProps {
  tier: string;
  size?: "sm" | "md" | "lg";
}

export function TierBadge({ tier, size = "md" }: TierBadgeProps) {
  const colors = TIER_COLORS[tier] || TIER_COLORS.UR;
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
    lg: "text-sm px-3 py-1.5 font-bold",
  };
  return (
    <span className={`inline-flex items-center rounded font-mono font-bold border shadow-sm ${colors.bg} ${colors.text} ${colors.border} ${colors.glow ? `shadow-sm ${colors.glow}` : ""} ${sizeClasses[size]}`}>
      {tier}
    </span>
  );
}

export function getTierColor(tier: string) {
  return TIER_COLORS[tier] || TIER_COLORS.UR;
}
