import { useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Crosshair, Shield, Swords, BarChart2, Hash } from "lucide-react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CloudBackground } from "@/components/clouds";
import { TierBadge, getTierColor, TIER_RANK } from "@/components/tier-badge";
import { MinecraftIcon } from "@/components/ui/minecraft-icon";
import { useGetPlayer, getGetPlayerQueryKey } from "@workspace/api-client-react";

function getFlag(code?: string | null) {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

function StatPill({ label, value, icon: Icon, color = "text-white" }: {
  label: string;
  value: string | number;
  icon: any;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-white/3 border border-white/5">
      <Icon size={14} className="text-gray-500" />
      <span className={`text-lg font-black font-mono ${color}`}>{typeof value === "number" ? value.toLocaleString() : value}</span>
      <span className="text-[10px] text-gray-600 uppercase tracking-widest">{label}</span>
    </div>
  );
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 animate-pulse" />
          <div className="text-cyan-400 animate-pulse font-mono text-sm">Loading player...</div>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <div className="text-7xl font-black text-white/10">404</div>
        <div className="text-gray-400 font-semibold">Player not found</div>
        <Link href="/leaderboard" className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm flex items-center gap-2">
          <ArrowLeft size={14} /> Back to Leaderboard
        </Link>
      </div>
    );
  }

  // Sort rankings best-first by tier value
  const sortedRankings = [...(player.rankings ?? [])].sort(
    (a, b) => (TIER_RANK[b.tier] ?? 0) - (TIER_RANK[a.tier] ?? 0)
  );

  const totalKills = sortedRankings.reduce((s, r) => s + (r.kills ?? 0), 0);
  const totalDeaths = sortedRankings.reduce((s, r) => s + (r.deaths ?? 0), 0);
  const totalMatches = sortedRankings.reduce((s, r) => s + (r.matches ?? 0), 0);
  const overallKdr = totalDeaths === 0 ? totalKills : Math.round((totalKills / totalDeaths) * 100) / 100;

  const tierColor = player.overallTier ? getTierColor(player.overallTier) : null;

  return (
    <div className="min-h-screen bg-black text-white relative">
      <CloudBackground />
      <Navbar />

      <main className="relative z-10 pt-24 pb-24 max-w-5xl mx-auto px-4">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-white transition-colors mb-8 text-sm group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Leaderboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* ── Hero Card ── */}
          <div className="relative rounded-2xl border border-white/8 bg-[#08080f]/80 backdrop-blur-sm overflow-hidden mb-5">
            {/* Gradient accent top */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
            {/* Subtle background glow */}
            {tierColor && (
              <div className={`absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-[0.06] pointer-events-none ${tierColor.bg}`} />
            )}

            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">

                {/* Skin */}
                <div className="flex-shrink-0 flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="w-28 h-44 rounded-xl border border-white/10 bg-gradient-to-b from-white/3 to-transparent overflow-hidden flex items-end justify-center p-1">
                      <img
                        src={`https://mc-heads.net/body/${player.minecraftUsername}/100`}
                        alt={player.minecraftUsername}
                        className="h-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/body/steve/100"; }}
                      />
                    </div>
                    {/* Online dot */}
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                  </div>
                  {player.overallTier && <TierBadge tier={player.overallTier} size="lg" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left">
                  {/* Name + flag */}
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                      {player.minecraftUsername}
                    </h1>
                    {player.countryCode && (
                      <span className="text-2xl" title={player.country || ""}>
                        {getFlag(player.countryCode)}
                      </span>
                    )}
                  </div>

                  {/* Country + Discord */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-5 flex-wrap">
                    {player.country && <span>{player.country}</span>}
                    {player.discord && (
                      <span className="text-indigo-400">@{player.discord}</span>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-sm sm:max-w-none">
                    <StatPill label="Points" value={player.points} icon={Star} color="text-cyan-400" />
                    <StatPill label="Gamemodes" value={sortedRankings.length} icon={Hash} color="text-white" />
                    <StatPill label="KDR" value={overallKdr} icon={Crosshair} color="text-red-400" />
                    <StatPill label="Matches" value={totalMatches} icon={BarChart2} color="text-purple-400" />
                  </div>

                  {/* Badges */}
                  {player.badges && player.badges.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {player.badges.map((badge: any) => (
                        <span
                          key={badge.id}
                          title={badge.description || badge.name}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border border-white/10 bg-white/5 text-gray-200 cursor-default"
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
          </div>

          {/* ── Gamemode Rankings ── */}
          {sortedRankings.length > 0 ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Swords size={18} className="text-cyan-400" />
                <h2 className="text-lg font-black text-white tracking-wide">Gamemode Rankings</h2>
                <span className="text-xs text-gray-600 font-mono">{sortedRankings.length} gamemodes</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedRankings.map((ranking, i) => {
                  const tc = getTierColor(ranking.tier);
                  const kdr = (ranking.kdr ?? 0).toFixed(2);
                  return (
                    <motion.div
                      key={ranking.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`relative rounded-xl border bg-[#0a0a0f]/80 backdrop-blur-sm p-4 hover:border-cyan-500/20 transition-all overflow-hidden group ${tc.border}`}
                      style={{ borderColor: undefined }}
                    >
                      {/* Top line accent */}
                      <div className={`absolute top-0 left-0 right-0 h-px ${tc.bg} opacity-60`} />

                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0">
                            <MinecraftIcon name={ranking.gamemodeName ?? ""} size={18} />
                          </div>
                          <span className="text-sm font-bold text-gray-300 uppercase tracking-wide leading-tight">
                            {ranking.gamemodeName}
                          </span>
                        </div>
                        <TierBadge tier={ranking.tier} size="sm" />
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">Points</div>
                          <div className={`text-sm font-black font-mono ${tc.text}`}>{(ranking.points ?? 0).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">KDR</div>
                          <div className="text-sm font-black text-white">{kdr}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">Win%</div>
                          <div className="text-sm font-black text-green-400">{(ranking.winRate ?? 0).toFixed(1)}%</div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-3 pt-2.5 border-t border-white/5 flex justify-between text-[11px] text-gray-600 font-mono">
                        <span className="flex items-center gap-1">
                          <Shield size={10} /> {ranking.matches ?? 0} matches
                        </span>
                        <span>{ranking.kills ?? 0}K / {ranking.deaths ?? 0}D</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 border border-white/5 rounded-2xl bg-white/2">
              <div className="w-14 h-14 rounded-xl bg-white/3 border border-white/5 flex items-center justify-center mx-auto mb-4">
                <BarChart2 size={24} className="text-gray-700" />
              </div>
              <p className="text-gray-500 font-semibold">No gamemode rankings yet</p>
              <p className="text-gray-700 text-sm mt-1">This player hasn't been ranked in any gamemode</p>
            </div>
          )}

        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
