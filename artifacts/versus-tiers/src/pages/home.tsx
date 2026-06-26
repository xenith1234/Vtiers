import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Users, Trophy, Sword, ExternalLink, TrendingUp, Star, Zap } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CloudBackground } from "@/components/clouds";
import { TierBadge } from "@/components/tier-badge";
import { MinecraftIcon } from "@/components/ui/minecraft-icon";
import { useGetSiteStats, useGetTopPlayers, useListGamemodes, useListAnnouncements } from "@workspace/api-client-react";

const TIER_ORDER = ["HT5", "HT4", "HT3", "HT2", "HT1", "LT5", "LT4", "LT3", "LT2", "LT1", "UR"];
const TIER_COLORS: Record<string, string> = {
  HT5: "text-red-400", HT4: "text-orange-400", HT3: "text-yellow-400",
  HT2: "text-lime-400", HT1: "text-green-400",
  LT5: "text-teal-400", LT4: "text-cyan-400", LT3: "text-blue-400",
  LT2: "text-violet-400", LT1: "text-purple-400", UR: "text-gray-400",
};

function StatTicker({ label, value, icon: Icon }: { label: string; value: number | string; icon: any }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 border border-cyan-500/10 rounded-xl bg-black/40 backdrop-blur-sm">
      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
        <Icon size={18} className="text-cyan-400" />
      </div>
      <div>
        <div className="text-2xl font-black text-white font-mono">{typeof value === "number" ? value.toLocaleString() : value}</div>
        <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

function TierGuideRow({ tier }: { tier: string }) {
  const color = TIER_COLORS[tier] ?? "text-gray-400";
  const labels: Record<string, string> = {
    HT5: "Top 0.1% — The absolute elite", HT4: "Top 0.5% — Near god-tier",
    HT3: "Top 1% — Exceptional", HT2: "Top 2% — Very high skill",
    HT1: "Top 5% — High tier", LT5: "Top 10% — Above average",
    LT4: "Top 20% — Solid player", LT3: "Top 35% — Mid-high",
    LT2: "Top 50% — Average", LT1: "Below average", UR: "Unranked",
  };
  return (
    <div className="flex items-center gap-4 py-2.5 border-b border-white/5 last:border-0">
      <div className={`w-12 text-center font-black text-sm font-mono ${color}`}>{tier}</div>
      <div className="text-sm text-gray-400">{labels[tier]}</div>
    </div>
  );
}

export default function HomePage() {
  const { data: stats } = useGetSiteStats();
  const { data: topPlayers } = useGetTopPlayers({ params: { limit: 3 } });
  const { data: gamemodes } = useListGamemodes();
  const { data: announcements } = useListAnnouncements();

  const activeAnnouncements = announcements?.filter(a => a.active) ?? [];

  return (
    <div className="min-h-screen bg-black text-white relative">
      <CloudBackground />
      <Navbar />

      <main className="relative z-10 pt-16">
        {/* Hero */}
        <section className="pt-32 pb-24 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-5xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-sm font-semibold mb-8">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              The #1 Minecraft PvP Ranking Platform
            </div>

            <h1 className="text-5xl sm:text-7xl font-black leading-none tracking-tight mb-6">
              <span className="text-white">The Ultimate</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200">
                Minecraft PvP
              </span>
              <br />
              <span className="text-white">Tier Rankings</span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Compete across 25+ gamemodes. Prove your rank. Rise to the top.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/leaderboard">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-8 py-4 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-all shadow-xl shadow-cyan-500/30 text-lg"
                >
                  View Rankings <ArrowRight size={20} />
                </motion.button>
              </Link>
              <a href="https://discord.gg/versustiers" target="_blank" rel="noopener noreferrer">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-8 py-4 border border-white/10 text-white font-bold rounded-xl hover:border-white/20 hover:bg-white/5 transition-all text-lg"
                >
                  Join Discord <ExternalLink size={18} />
                </motion.button>
              </a>
            </div>
          </motion.div>
        </section>

        {/* Active Announcements */}
        {activeAnnouncements.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 pb-12">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
              {activeAnnouncements.slice(0, 3).map(ann => (
                <div key={ann.id} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
                  <span className="text-cyan-400 mt-0.5 flex-shrink-0">📢</span>
                  <span className="text-sm text-gray-200">{ann.text}</span>
                </div>
              ))}
            </motion.div>
          </section>
        )}

        {/* Stats Bar */}
        {stats && (
          <section className="max-w-5xl mx-auto px-4 pb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <StatTicker label="Ranked Players" value={stats.totalPlayers} icon={Users} />
              <StatTicker label="Active Gamemodes" value={stats.totalGamemodes} icon={Sword} />
              <StatTicker label="Total Rankings" value={stats.totalRankings} icon={Trophy} />
            </motion.div>
          </section>
        )}

        {/* Top Players */}
        {topPlayers && topPlayers.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 pb-20">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <Star size={20} className="text-yellow-400" /> Top Ranked Players
                </h2>
                <Link href="/leaderboard" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topPlayers.map((entry, i) => (
                  <motion.div
                    key={entry.player.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  >
                    <Link href={`/players/${entry.player.id}`}>
                      <div className={`relative rounded-xl border p-5 bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all cursor-pointer group ${
                        i === 0 ? "border-yellow-500/40 shadow-lg shadow-yellow-500/10" :
                        i === 1 ? "border-gray-400/30" :
                        "border-amber-700/30"
                      }`}>
                        <div className="absolute top-3 right-3 text-3xl font-black opacity-10 font-mono">#{entry.rank}</div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="relative">
                            <img
                              src={`https://mc-heads.net/avatar/${entry.player.minecraftUsername}/64`}
                              alt={entry.player.minecraftUsername}
                              className="w-12 h-12 rounded-lg border border-white/10"
                              onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/64"; }}
                            />
                            <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border ${
                              i === 0 ? "bg-yellow-500 text-black border-yellow-400" :
                              i === 1 ? "bg-gray-300 text-black border-gray-200" :
                              "bg-amber-700 text-white border-amber-600"
                            }`}>{entry.rank}</div>
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">{entry.player.minecraftUsername}</div>
                            <TierBadge tier={entry.overallTier} size="sm" />
                          </div>
                        </div>
                        <div className="text-2xl font-black text-cyan-400 font-mono">{entry.totalPoints.toLocaleString()}</div>
                        <div className="text-xs text-gray-600">total points</div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>
        )}

        {/* Tier Guide */}
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div>
                <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                  <TrendingUp size={20} className="text-cyan-400" /> Tier System
                </h2>
                <p className="text-gray-500 text-sm mb-6">How ranking works on VERSUS TIERS</p>
                <div className="rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm p-4">
                  {TIER_ORDER.map(tier => <TierGuideRow key={tier} tier={tier} />)}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                  <Zap size={20} className="text-cyan-400" /> How It Works
                </h2>
                <p className="text-gray-500 text-sm mb-6">The ranking process explained</p>
                <div className="space-y-4">
                  {[
                    { step: "01", title: "Join Discord", desc: "Head to our Discord server and open a rank request ticket with proof of your skill." },
                    { step: "02", title: "Submit Evidence", desc: "Provide screenshots, clips or match history demonstrating your gameplay." },
                    { step: "03", title: "Staff Review", desc: "Our experienced staff team evaluates your submission across all relevant gamemodes." },
                    { step: "04", title: "Get Ranked", desc: "Receive your official tier badge and appear on the public leaderboard." },
                  ].map(item => (
                    <div key={item.step} className="flex gap-4">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-black text-cyan-400 font-mono">{item.step}</span>
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm mb-1">{item.title}</div>
                        <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Gamemodes */}
        {gamemodes && gamemodes.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 pb-20">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              <h2 className="text-2xl font-black text-white mb-6">Browse Gamemodes</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {gamemodes.slice(0, 15).map((gm, i) => (
                  <motion.div
                    key={gm.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.03 }}
                  >
                    <Link href={`/leaderboard?gamemode=${gm.id}`}>
                      <div className="rounded-xl border border-cyan-500/10 bg-black/40 p-4 text-center hover:border-cyan-500/30 hover:bg-black/60 transition-all cursor-pointer group">
                        <div className="flex justify-center mb-2"><MinecraftIcon name={gm.name} size={32} /></div>
                        <div className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors truncate">{gm.name}</div>
                        <div className="text-xs text-gray-600 mt-1">{gm.playerCount} players</div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
                {gamemodes.length > 15 && (
                  <Link href="/leaderboard">
                    <div className="rounded-xl border border-white/5 bg-white/2 p-4 text-center hover:border-white/10 transition-all cursor-pointer flex flex-col items-center justify-center h-full">
                      <div className="text-2xl mb-2 text-gray-600">+{gamemodes.length - 15}</div>
                      <div className="text-xs text-gray-600">more</div>
                    </div>
                  </Link>
                )}
              </div>
            </motion.div>
          </section>
        )}

        {/* CTA Banner */}
        <section className="max-w-5xl mx-auto px-4 pb-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <div className="relative rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-black/60 to-black/60 p-10 text-center overflow-hidden">
              <div className="absolute inset-0 bg-cyan-500/5 blur-3xl" />
              <div className="relative z-10">
                <div className="flex justify-center mb-4"><MinecraftIcon name="sword" size={40} /></div>
                <h2 className="text-3xl font-black text-white mb-3">Ready to get ranked?</h2>
                <p className="text-gray-400 mb-6 max-w-md mx-auto text-sm">Join the VERSUS TIERS community and prove your skill across all PvP gamemodes.</p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <Link href="/apply">
                    <button className="flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/25">
                      Apply for a Rank <ArrowRight size={16} />
                    </button>
                  </Link>
                  <a href="https://discord.gg/versustiers" target="_blank" rel="noopener noreferrer">
                    <button className="flex items-center gap-2 px-6 py-3 border border-white/10 text-white font-bold rounded-xl hover:border-white/20 hover:bg-white/5 transition-all">
                      Join Discord <ExternalLink size={16} />
                    </button>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
