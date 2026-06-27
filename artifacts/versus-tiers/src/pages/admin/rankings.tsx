import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Plus, Trash2, Pencil, X, Save } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { TierBadge } from "@/components/tier-badge";
import { useAuth } from "@/lib/auth-context";
import { useListRankings, useListGamemodes, useCreateRanking, useUpdateRanking, useDeleteRanking, useListPlayers, getListRankingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import type { RankingWithPlayer } from "@workspace/api-client-react/src/generated/api.schemas";

const TIERS = ["HT1","HT2","HT3","HT4","HT5","LT1","LT2","LT3","LT4","LT5","UR"];

function RankingModal({ ranking, gamemodeId, onClose }: { ranking?: RankingWithPlayer | null; gamemodeId?: number; onClose: () => void }) {
  const qc = useQueryClient();
  const createMutation = useCreateRanking();
  const updateMutation = useUpdateRanking();
  const { data: players } = useListPlayers({ params: { limit: 200 } });
  const { data: gamemodes } = useListGamemodes();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState({
    playerId: ranking?.player?.id?.toString() || "",
    gamemodeId: (ranking?.gamemodeId || gamemodeId)?.toString() || "",
    tier: ranking?.tier || "UR",
    points: ranking?.points?.toString() || "0",
    winRate: ranking?.winRate?.toString() || "0",
    matches: ranking?.matches?.toString() || "0",
    kills: ranking?.kills?.toString() || "0",
    deaths: ranking?.deaths?.toString() || "0",
  });

  const handleSave = async () => {
    setSaveError(null);
    if (!ranking && (!form.playerId || !form.gamemodeId)) {
      setSaveError("Please select both a player and a gamemode.");
      return;
    }
    const data = {
      playerId: parseInt(form.playerId),
      gamemodeId: parseInt(form.gamemodeId),
      tier: form.tier,
      points: parseInt(form.points) || 0,
      winRate: parseFloat(form.winRate) || 0,
      matches: parseInt(form.matches) || 0,
      kills: parseInt(form.kills) || 0,
      deaths: parseInt(form.deaths) || 0,
    };
    try {
      if (ranking) {
        await updateMutation.mutateAsync({ id: ranking.id, data });
      } else {
        await createMutation.mutateAsync({ data });
      }
      qc.invalidateQueries({ queryKey: getListRankingsQueryKey() });
      onClose();
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || "Failed to save ranking.";
      setSaveError(msg);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-2xl border border-white/10 bg-black/90 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black">{ranking ? "Edit Ranking" : "Add Ranking"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          {!ranking && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Player</label>
                <select value={form.playerId} onChange={e => setForm(f => ({ ...f, playerId: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50">
                  <option value="">Select player...</option>
                  {players?.players.map(p => <option key={p.id} value={p.id}>{p.minecraftUsername}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Gamemode</label>
                <select value={form.gamemodeId} onChange={e => setForm(f => ({ ...f, gamemodeId: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50">
                  <option value="">Select gamemode...</option>
                  {gamemodes?.map(gm => <option key={gm.id} value={gm.id}>{gm.icon} {gm.name}</option>)}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Tier</label>
            <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50">
              {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {[
            { key: "points", label: "Points" },
            { key: "winRate", label: "Win Rate (%)" },
            { key: "matches", label: "Matches" },
            { key: "kills", label: "Kills" },
            { key: "deaths", label: "Deaths" },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">{field.label}</label>
              <input
                type="number"
                value={(form as any)[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          ))}
        </div>
        {saveError && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {saveError}
          </div>
        )}
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-all text-sm">Cancel</button>
          <button
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 disabled:opacity-50 transition-all text-sm"
          >
            <Save size={14} /> Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminRankingsPage() {
  const [, navigate] = useLocation();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [selectedGamemodeId, setSelectedGamemodeId] = useState<number | undefined>();
  const [modal, setModal] = useState<RankingWithPlayer | null | undefined>(undefined);
  const [page, setPage] = useState(1);

  if (!user) { navigate("/auth/login"); return null; }
  if (!isAdmin) { navigate("/"); return null; }

  const { data: gamemodes } = useListGamemodes();
  const { data, isLoading } = useListRankings(
    { params: { gamemodeId: selectedGamemodeId, page, limit: 20 } },
    { query: { queryKey: getListRankingsQueryKey({ gamemodeId: selectedGamemodeId, page, limit: 20 }) } }
  );
  const deleteMutation = useDeleteRanking();

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this ranking?")) return;
    await deleteMutation.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListRankingsQueryKey() });
  };

  return (
    <AdminLayout title="Rankings Management">
      {modal !== undefined && <RankingModal ranking={modal} gamemodeId={selectedGamemodeId} onClose={() => setModal(undefined)} />}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <select
            value={selectedGamemodeId || ""}
            onChange={e => { setSelectedGamemodeId(e.target.value ? parseInt(e.target.value) : undefined); setPage(1); }}
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none flex-1"
          >
            <option value="">All Gamemodes</option>
            {gamemodes?.map(gm => <option key={gm.id} value={gm.id}>{gm.icon} {gm.name}</option>)}
          </select>
          <button
            onClick={() => setModal(null)}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-all text-sm"
          >
            <Plus size={16} /> Add Ranking
          </button>
        </div>

        <div className="rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5 bg-white/2">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Player</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Gamemode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Points</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-5 bg-white/5 rounded animate-pulse" /></td></tr>
                ))
              ) : data?.rankings.map(r => (
                <tr key={r.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-500 text-xs">#{r.rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img src={`https://mc-heads.net/avatar/${r.player.minecraftUsername}/24`} alt="" className="w-6 h-6 rounded border border-white/10"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/steve/24"; }} />
                      <span className="font-semibold text-white">{r.player.minecraftUsername}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{r.gamemodeName}</td>
                  <td className="px-4 py-3"><TierBadge tier={r.tier} size="sm" /></td>
                  <td className="px-4 py-3 text-right font-mono text-cyan-400 hidden md:table-cell">{r.points}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal(r)} className="p-1.5 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-all"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>{data.total} total rankings</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border border-white/10 hover:border-white/20 disabled:opacity-30 transition-all">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= data.total} className="px-3 py-1 rounded border border-white/10 hover:border-white/20 disabled:opacity-30 transition-all">Next</button>
            </div>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
