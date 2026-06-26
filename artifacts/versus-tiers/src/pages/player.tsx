import { useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CloudBackground } from "@/components/clouds";
import { TierBadge } from "@/components/tier-badge";
import { useGetPlayer, getGetPlayerQueryKey } from "@workspace/api-client-react";

function getFlag(code?: string | null) {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

export default function PlayerPage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0");

  const { data: player, isLoading, error } = useGetPlayer(id, {
    query: { queryKey: getGetPlayerQueryKey(id), enabled: !!id }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse font-mono text-lg">Loading player...</div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">404</div>
        <div className="text-gray-400">Player not found</div>
        <Link href="/leaderboard" className="text-cyan-400 hover:text-cyan-300 transition-colors">← Back to Leaderboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <CloudBackground />
      <Navbar />

      <main className="relative z-10 pt-24 pb-20 max-w-5xl mx-auto px-4">
        <Link href="/leaderboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 text-sm">
          <ArrowLeft size={16} />
          Back to Leaderboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Profile Header */}
          <div className="relative rounded-2xl border border-cyan-500/20 bg-black/60 backdrop-blur-sm p-8 mb-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row gap-6 items-start">
              {/* Full body skin */}
              <div className="flex-shrink-0 relative">
                <div className="w-32 h-48 rounded-xl border border-white/10 bg-black/50 overflow-hidden flex items-center justify-center">
                  <img
                    src={`https://mc-heads.net/body/${player.minecraftUsername}/100`}
                    alt={player.minecraftUsername}
                    className="h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/body/steve/100"; }}
                  />
                </div>
                {player.overallTier && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                    <TierBadge tier={player.overallTier} size="lg" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  <h1 className="text-4xl font-black text-white">{player.minecraftUsername}</h1>
                  {player.countryCode && (
                    <span className="text-3xl" title={player.country || ""}>{getFlag(player.countryCode)}</span>
                  )}
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  <div>
                    <div className="text-xs text-gray-600 uppercase tracking-wider">Country</div>
                    <div className="text-sm font-semibold text-gray-300">{player.country || "Unknown"}</div>
                  </div>
                  {player.discord && (
                    <div>
                      <div className="text-xs text-gray-600 uppercase tracking-wider">Discord</div>
                      <div className="text-sm font-semibold text-indigo-400">@{player.discord}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-gray-600 uppercase tracking-wider">Total Points</div>
                    <div className="text-sm font-black text-cyan-400 font-mono">{player.points.toLocaleString()}</div>
                  </div>
                </div>

                {/* Badges */}
                {player.badges && player.badges.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {player.badges.map(badge => (
                      <span
                        key={badge.id}
                        title={badge.description || badge.name}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold border border-white/10 bg-white/5 text-gray-200"
                        style={badge.color ? { borderColor: badge.color + "40", color: badge.color, backgroundColor: badge.color + "10" } : {}}
                      >
                        {badge.icon} {badge.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rankings Grid */}
          {player.rankings && player.rankings.length > 0 && (
            <div>
              <h2 className="text-xl font-black text-white mb-4">Gamemode Rankings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {player.rankings.map((ranking, i) => (
                  <motion.div
                    key={ranking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-xl border border-white/5 bg-black/40 p-4 hover:border-cyan-500/20 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-bold text-gray-300">{ranking.gamemodeName}</div>
                      <TierBadge tier={ranking.tier} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-xs text-gray-600">Points</div>
                        <div className="text-sm font-bold text-cyan-400 font-mono">{ranking.points}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">KDR</div>
                        <div className="text-sm font-bold text-white">{(ranking.kdr ?? 0).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Win%</div>
                        <div className="text-sm font-bold text-green-400">{(ranking.winRate ?? 0).toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/5 flex justify-between text-xs text-gray-600">
                      <span>{ranking.matches} matches</span>
                      <span>{ranking.kills}K / {ranking.deaths}D</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {(!player.rankings || player.rankings.length === 0) && (
            <div className="text-center py-12 text-gray-600 border border-white/5 rounded-xl">
              <div className="text-4xl mb-3">📊</div>
              <p>No gamemode rankings yet</p>
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
