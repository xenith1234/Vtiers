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

const RANK_BORDER: Record<number, string> = {
  1: "border-yellow-500/70",
  2: "border-gray-400/50",
  3: "border-amber-600/60",
};

const RANK_GLOW: Record<number, string> = {
  1: "shadow-lg shadow-yellow-500/10",
  2: "shadow-lg shadow-gray-400/5",
  3: "shadow-lg shadow-amber-700/10",
};

const RANK_NUM_COLOR: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-gray-300",
  3: "text-amber-600",
};

export function PlayerCard({ ranking, index = 0 }: PlayerCardProps) {
  const rank = ranking.rank ?? index + 1;
  const player = ranking.player;
  const rawGmRankings: GamemodeRanking[] = (ranking as any).gamemodeRankings ?? [];

  // Sort gamemodeRankings by tier value — best tier first (HT1 > HT2 > ... > UR)
  const gmRankings = [...rawGmRankings].sort(
    (a, b) => (TIER_RANK[b.tier] ?? 0) - (TIER_RANK[a.tier] ?? 0)
  );

  const borderClass = rank && RANK_BORDER[rank] ? RANK_BORDER[rank] : "border-white/8 hover:border-cyan-500/25";
  const glowClass = rank && RANK_GLOW[rank] ? RANK_GLOW[rank] : "";
  const rankNumColor = rank && RANK_NUM_COLOR[rank] ? RANK_NUM_COLOR[rank] : "text-gray-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link href={`/players/${player.id}`}>
        <div className={`group relative rounded-xl border bg-[#0a0a0f]/80 backdrop-blur-sm transition-all duration-200 hover:bg-[#0d0d14]/90 cursor-pointer overflow-hidden ${borderClass} ${glowClass}`}>

          {rank === 1 && (
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent" />
          )}

          <div className="p-4 pb-3">
            <div className="flex items-center gap-3">
              {/* Rank */}
              <div className="w-8 flex-shrink-0 text-center">
                <span className={`text-xl font-black font-mono ${rankNumColor}`}>{rank}.</span>
              </div>

              {/* Skin */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-black/50">
                  <img
                    src={`https://mc-heads.net/avatar/${player.minecraftUsername}/64`}
                    alt={player.minecraftUsername}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/64"; }}
                  />
                </div>
                {rank <= 3 && (
                  <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-black border ${
                    rank === 1 ? "bg-yellow-500 text-black border-yellow-400" :
                    rank === 2 ? "bg-gray-300 text-black border-gray-200" :
                    "bg-amber-700 text-white border-amber-600"
                  }`}>{rank}</div>
                )}
              </div>

              {/* Name + tier + points */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors truncate">
                    {player.minecraftUsername}
                  </span>
                  {player.countryCode && (
                    <span className="text-base" title={player.country || ""}>{getFlag(player.countryCode)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <TierBadge tier={ranking.tier} size="sm" />
                  <span className="text-gray-500 text-xs font-mono">{ranking.points} pts</span>
                </div>
                {player.badges && player.badges.length > 0 && (
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {player.badges.slice(0, 3).map((badge: any) => (
                      <span
                        key={badge.id}
                        title={badge.description || badge.name}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border border-white/10 bg-white/5 text-gray-400 uppercase tracking-wider"
                        style={badge.color ? { borderColor: badge.color + "50", color: badge.color, backgroundColor: badge.color + "15" } : {}}
                      >
                        {badge.icon} {badge.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* VT site tag */}
              <div className="flex-shrink-0 hidden sm:block">
                <span className="text-[10px] font-black text-gray-600 bg-white/5 border border-white/5 px-1.5 py-0.5 rounded tracking-widest">
                  VT
                </span>
              </div>
            </div>
          </div>

          {/* Per-gamemode TIERS row — sorted best first */}
          {gmRankings.length > 0 && (
            <div className="px-4 pb-3 border-t border-white/5 pt-2.5">
              <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Tiers</div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {gmRankings.map((gmr) => {
                  const tc = getTierColor(gmr.tier);
                  return (
                    <div key={gmr.gamemodeId} className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center" title={gmr.gamemodeName}>
                        <MinecraftIcon name={gmr.gamemodeName} size={18} />
                      </div>
                      <span className={`text-[9px] font-black font-mono px-1 py-0.5 rounded border ${tc.bg} ${tc.text} ${tc.border}`}>
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
