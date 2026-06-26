import { motion } from "framer-motion";
import { Link } from "wouter";
import { TierBadge } from "./tier-badge";
import type { RankingWithPlayer } from "@workspace/api-client-react/src/generated/api.schemas";

function getFlag(countryCode?: string | null): string {
  if (!countryCode || countryCode.length !== 2) return "";
  const code = countryCode.toUpperCase();
  return String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

interface PlayerCardProps {
  ranking: RankingWithPlayer;
  index?: number;
}

const RANK_COLORS: Record<number, string> = {
  1: "border-yellow-500/60 bg-gradient-to-r from-yellow-500/10 to-transparent",
  2: "border-gray-400/60 bg-gradient-to-r from-gray-400/10 to-transparent",
  3: "border-amber-700/60 bg-gradient-to-r from-amber-700/10 to-transparent",
};

export function PlayerCard({ ranking, index = 0 }: PlayerCardProps) {
  const rank = ranking.rank;
  const player = ranking.player;
  const rankBorder = rank && RANK_COLORS[rank] ? RANK_COLORS[rank] : "border-cyan-500/10 hover:border-cyan-500/30";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link href={`/players/${player.id}`}>
        <div className={`group relative rounded-xl border bg-black/40 backdrop-blur-sm p-4 transition-all duration-300 hover:bg-black/60 cursor-pointer ${rankBorder}`}>
          {/* Rank number */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 text-center">
              <span className={`text-2xl font-black ${rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-300" : rank === 3 ? "text-amber-700" : "text-gray-600"}`}>
                {rank}.
              </span>
            </div>

            {/* Skin Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 bg-black/50">
                <img
                  src={`https://mc-heads.net/avatar/${player.minecraftUsername}/64`}
                  alt={player.minecraftUsername}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/64";
                  }}
                />
              </div>
              {rank && rank <= 3 && (
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold border ${
                  rank === 1 ? "bg-yellow-500 text-black border-yellow-400" :
                  rank === 2 ? "bg-gray-300 text-black border-gray-200" :
                  "bg-amber-700 text-white border-amber-600"
                }`}>
                  {rank}
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-lg group-hover:text-cyan-300 transition-colors truncate">
                  {player.minecraftUsername}
                </span>
                {player.countryCode && (
                  <span className="text-lg" title={player.country || ""}>
                    {getFlag(player.countryCode)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <TierBadge tier={ranking.tier} />
                <span className="text-gray-500 text-xs font-mono">{ranking.points} pts</span>
                {player.discord && (
                  <span className="text-xs text-gray-600 truncate">@{player.discord}</span>
                )}
              </div>
              {/* Badge row */}
              {player.badges && player.badges.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {player.badges.map((badge) => (
                    <span
                      key={badge.id}
                      title={badge.description || badge.name}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border border-white/10 bg-white/5 text-gray-300"
                      style={badge.color ? { borderColor: badge.color + "40", color: badge.color } : {}}
                    >
                      {badge.icon} {badge.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
              <div className="text-xs text-gray-500 font-mono">KDR</div>
              <div className="text-sm font-bold text-white">{ranking.kdr?.toFixed(2) || "0.00"}</div>
              <div className="text-xs text-gray-600">{ranking.matches} matches</div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
