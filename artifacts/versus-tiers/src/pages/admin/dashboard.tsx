import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Users, Trophy, Sword, Award, Activity, TrendingUp } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAuth } from "@/lib/auth-context";
import { useGetSiteStats, useGetRecentActivity, useGetTierDistribution } from "@workspace/api-client-react";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: any; color: string }) {
  return (
    <div className={`rounded-xl border p-5 bg-black/40 ${color}`}>
      <div className="flex items-center justify-between mb-3">
        <Icon size={20} className="text-gray-400" />
        <span className="text-xs text-gray-600 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-3xl font-black text-white font-mono">{typeof value === "number" ? value.toLocaleString() : value}</div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [, navigate] = useLocation();
  const { user, isAdmin } = useAuth();

  if (!user) { navigate("/auth/login"); return null; }
  if (!isAdmin) { navigate("/"); return null; }

  const { data: stats } = useGetSiteStats();
  const { data: activity } = useGetRecentActivity({ params: { limit: 8 } });
  const { data: tierDist } = useGetTierDistribution({});

  return (
    <AdminLayout title="Dashboard">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="border-blue-500/20" />
            <StatCard label="Players" value={stats.totalPlayers} icon={Trophy} color="border-cyan-500/20" />
            <StatCard label="Gamemodes" value={stats.totalGamemodes} icon={Sword} color="border-purple-500/20" />
            <StatCard label="Rankings" value={stats.totalRankings} icon={Award} color="border-green-500/20" />
            <StatCard label="Online Now" value={stats.onlineUsers} icon={Activity} color="border-yellow-500/20" />
            <StatCard label="New Today" value={stats.recentRegistrations} icon={TrendingUp} color="border-orange-500/20" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="rounded-xl border border-white/5 bg-black/40 p-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {activity?.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-300 truncate">{item.description}</div>
                    <div className="text-xs text-gray-600">{new Date(item.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              )) || <div className="text-gray-600 text-sm">No recent activity</div>}
            </div>
          </div>

          {/* Tier Distribution */}
          <div className="rounded-xl border border-white/5 bg-black/40 p-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Tier Distribution</h2>
            <div className="space-y-2">
              {tierDist?.slice(0, 8).map((item) => {
                const max = tierDist[0]?.count || 1;
                const pct = (item.count / max) * 100;
                return (
                  <div key={item.tier} className="flex items-center gap-3">
                    <div className="w-10 text-xs font-mono text-right text-gray-400">{item.tier}</div>
                    <div className="flex-1 bg-white/5 rounded-full h-2">
                      <div className="bg-cyan-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-8 text-xs text-gray-500 text-right">{item.count}</div>
                  </div>
                );
              }) || <div className="text-gray-600 text-sm">No data</div>}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/admin/players", label: "Manage Players", icon: Trophy },
            { href: "/admin/rankings", label: "Manage Rankings", icon: Award },
            { href: "/admin/gamemodes", label: "Manage Gamemodes", icon: Sword },
            { href: "/admin/users", label: "Manage Users", icon: Users },
          ].map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/5 bg-black/40 hover:border-cyan-500/20 hover:bg-black/60 transition-all cursor-pointer text-center">
                  <Icon size={20} className="text-cyan-400" />
                  <span className="text-xs font-semibold text-gray-400">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </AdminLayout>
  );
}
