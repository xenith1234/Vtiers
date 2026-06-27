import { motion } from "framer-motion";
import { Link } from "wouter";
import { TierBadge, getTierColor, TIER_RANK } from "./tier-badge";
import { MinecraftIcon } from "./ui/minecraft-icon";
import type { RankingWithPlayer } from "@workspace/api-client-react/src/generated/api.schemas";

function getFlag(countryCode?: string | null): string {
  if (!countryCode || countryCode.length !== 2) return "";
  const code = countryCode.toUpperCase();
  return String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

interface GamemodeRanking {
  gamemodeId: number;
  gamemodeName: string;
  gamemodeIcon?: string | null;
  tier: string;
}

interface PlayerCardProps {
  ranking: RankingWithPlayer & { gamemodeRankings?: GamemodeRanking[] };
  index?: number;
}

// Rank 1 = gold, 2 = silver, 3 = bronze — full card border + glow matching reference
const RANK_STYLES: Record<number, { border: string; glow: string; topLine: string; rankColor: string }> = {
  1: {
    border: "border-yellow-500/80",
    glow: "shadow-[0_0_24px_rgba(234,179,8,0.15)]",
    topLine: "from-transparent via-yellow-500/70 to-transparent",
    rankColor: "text-yellow-400",
  },
  2: {
    border: "border-gray-400/60",
    glow: "shadow-[0_0_16px_rgba(156,163,175,0.10)]",
    topLine: "from-transparent via-gray-400/50 to-transparent",
    rankColor: "text-gray-300",
  },
  3: {
    border: "border-amber-700/70",
    glow: "shadow-[0_0_16px_rgba(180,83,9,0.12)]",
    topLine: "from-transparent via-amber-600/50 to-transparent",
    rankColor: "text-amber-600",
  },
};

const DEFAULT_STYLE = {
  border: "border-white/[0.07] hover:border-cyan-500/30",
  glow: "",
  topLine: "",
  rankColor: "text-gray-600",
};

export function PlayerCard({ ranking, index = 0 }: PlayerCardProps) {
  const rank = ranking.rank ?? index + 1;
  const player = ranking.player;
  const rawGmRankings: GamemodeRanking[] = (ranking as any).gamemodeRankings ?? [];

  // Sort best tier first (HT1 > HT2 > ... > UR)
  const gmRankings = [...rawGmRankings].sort(
    (a, b) => (TIER_RANK[b.tier] ?? 0) - (TIER_RANK[a.tier] ?? 0)
  );

  const style = RANK_STYLES[rank] ?? DEFAULT_STYLE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={`/players/${player.id}`}>
        <div
          className={`group relative rounded-2xl border bg-[#09090f] backdrop-blur-sm cursor-pointer overflow-hidden transition-all duration-200 hover:brightness-110 ${style.border} ${style.glow}`}
        >
          {/* Top shimmer line for ranked cards */}
          {style.topLine && (
            <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${style.topLine}`} />
          )}

          {/* ── Main info row ── */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-4">

            {/* Rank number */}
            <div className="flex-shrink-0 w-9 text-left">
              <span className={`text-2xl font-black font-mono leading-none italic ${style.rankColor}`}>
                {rank}.
              </span>
            </div>

            {/* Minecraft head avatar */}
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 bg-black/60">
                <img
                  src={`https://mc-heads.net/avatar/${player.minecraftUsername}/64`}
                  alt={player.minecraftUsername}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/64";
                  }}
                />
              </div>
            </div>

            {/* Name + tier + badges */}
            <div className="flex-1 min-w-0">
              {/* Username + flag */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-bold text-white text-[17px] leading-tight group-hover:text-cyan-300 transition-colors truncate">
                  {player.minecraftUsername}
                </span>
                {player.countryCode && (
                  <span className="text-sm leading-none" title={player.country || ""}>
                    {getFlag(player.countryCode)}
                  </span>
                )}
              </div>

              {/* ♦ TIER (points pts) — matches reference exactly */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-gray-500 text-sm leading-none">♦</span>
                <TierBadge tier={ranking.tier} size="sm" />
                <span className="text-gray-500 text-xs font-mono">
                  ({ranking.points.toLocaleString()} pts)
                </span>
              </div>

              {/* Player badges (EXPERT, VETERAN, etc.) */}
              {player.badges && player.badges.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {player.badges.slice(0, 3).map((badge: any) => (
                    <span
                      key={badge.id}
                      title={badge.description || badge.name}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black border border-white/10 bg-white/5 text-gray-300 uppercase tracking-widest"
                      style={
                        badge.color
                          ? {
                              borderColor: badge.color + "55",
                              color: badge.color,
                              backgroundColor: badge.color + "18",
                            }
                          : {}
                      }
                    >
                      {badge.icon && <span className="text-[9px]">{badge.icon}</span>}
                      {badge.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* VT server tag — right side, matches "AS" in reference */}
            <div className="flex-shrink-0 self-start mt-1">
              <span className="text-[11px] font-black text-gray-600 bg-white/5 border border-white/8 px-2 py-1 rounded-md tracking-widest">
                VT
              </span>
            </div>
          </div>

          {/* ── TIERS row ── */}
          {gmRankings.length > 0 && (
            <div className="px-5 pb-5 border-t border-white/[0.05] pt-3">
              <div className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3">
                Tiers
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                {gmRankings.map((gmr) => {
                  const tc = getTierColor(gmr.tier);
                  return (
                    <div
                      key={gmr.gamemodeId}
                      className="flex flex-col items-center gap-1.5 flex-shrink-0"
                      title={gmr.gamemodeName}
                    >
                      {/* Circular icon bubble — matches reference exactly */}
                      <div className="w-10 h-10 rounded-full bg-[#1a1a22] border border-white/[0.08] flex items-center justify-center">
                        <MinecraftIcon name={gmr.gamemodeName} size={22} />
                      </div>
                      {/* Tier badge below icon */}
                      <span
                        className={`text-[9px] font-black font-mono px-1.5 py-0.5 rounded border ${tc.bg} ${tc.text} ${tc.border}`}
                      >
                        {gmr.tier}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
