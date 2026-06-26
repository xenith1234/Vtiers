import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Save } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAuth } from "@/lib/auth-context";
import { useListGamemodes, useCreateGamemode, useUpdateGamemode, useDeleteGamemode, getListGamemodesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import type { Gamemode } from "@workspace/api-client-react/src/generated/api.schemas";

const GAMEMODE_ICONS = ["⚔️","🪓","💎","🧪","🛡️","🏹","🗡️","🔥","⚡","🌟","🎯","🏆","👑","💀","🌙","☀️","🎪","🎮","⚙️","🧲"];

function GamemodeModal({ gm, onClose }: { gm?: Gamemode | null; onClose: () => void }) {
  const qc = useQueryClient();
  const createMutation = useCreateGamemode();
  const updateMutation = useUpdateGamemode();
  const [form, setForm] = useState({
    name: gm?.name || "",
    icon: gm?.icon || "⚔️",
    description: gm?.description || "",
    enabled: gm?.enabled ?? true,
    sortOrder: gm?.sortOrder?.toString() || "0",
    color: gm?.color || "#00e5ff",
  });

  const handleSave = async () => {
    const data = { ...form, sortOrder: parseInt(form.sortOrder) || 0 };
    if (gm) {
      await updateMutation.mutateAsync({ id: gm.id, data });
    } else {
      await createMutation.mutateAsync({ data });
    }
    qc.invalidateQueries({ queryKey: getListGamemodesQueryKey() });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-2xl border border-white/10 bg-black/90 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black">{gm ? "Edit Gamemode" : "Add Gamemode"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Icon</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {GAMEMODE_ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setForm(f => ({ ...f, icon }))}
                  className={`w-8 h-8 rounded text-lg transition-all ${form.icon === icon ? "bg-cyan-500/20 border border-cyan-500/50" : "border border-white/10 hover:border-white/20"}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          {[
            { key: "name", label: "Name", placeholder: "Sword PvP" },
            { key: "description", label: "Description", placeholder: "Classic sword fighting" },
            { key: "sortOrder", label: "Sort Order", placeholder: "0", type: "number" },
            { key: "color", label: "Color", placeholder: "#00e5ff", type: "color" },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">{field.label}</label>
              <input
                type={field.type || "text"}
                value={(form as any)[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
              className="w-4 h-4 rounded" />
            <span className="text-sm text-gray-300">Enabled</span>
          </label>
        </div>
        <div className="flex gap-3 mt-6">
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

export default function AdminGamemodesPage() {
  const [, navigate] = useLocation();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [modal, setModal] = useState<Gamemode | null | undefined>(undefined);

  if (!user) { navigate("/auth/login"); return null; }
  if (!isAdmin) { navigate("/"); return null; }

  const { data: gamemodes, isLoading } = useListGamemodes({ params: { includeDisabled: true } }, { query: { queryKey: getListGamemodesQueryKey({ includeDisabled: true }) } });
  const deleteMutation = useDeleteGamemode();
  const updateMutation = useUpdateGamemode();

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this gamemode? All rankings will be removed.")) return;
    await deleteMutation.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListGamemodesQueryKey() });
  };

  const handleToggle = async (gm: Gamemode) => {
    await updateMutation.mutateAsync({ id: gm.id, data: { enabled: !gm.enabled } });
    qc.invalidateQueries({ queryKey: getListGamemodesQueryKey() });
  };

  return (
    <AdminLayout title="Gamemode Management">
      {modal !== undefined && <GamemodeModal gm={modal} onClose={() => setModal(undefined)} />}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-500 text-sm">{gamemodes?.length || 0} gamemodes</p>
          <button
            onClick={() => setModal(null)}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-all text-sm"
          >
            <Plus size={16} /> Add Gamemode
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-white/2 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {gamemodes?.map((gm, i) => (
              <motion.div
                key={gm.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`rounded-xl border p-4 transition-all ${gm.enabled ? "border-white/10 bg-black/40" : "border-white/5 bg-black/20 opacity-60"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{gm.icon || "⚔️"}</span>
                    <div>
                      <div className="font-bold text-white">{gm.name}</div>
                      <div className="text-xs text-gray-600">{gm.playerCount} players</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleToggle(gm)} className={`p-1.5 rounded transition-all ${gm.enabled ? "text-green-400 hover:bg-green-500/10" : "text-gray-600 hover:bg-white/5"}`}>
                      {gm.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => setModal(gm)} className="p-1.5 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-all"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(gm.id)} className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>
                {gm.description && <div className="text-xs text-gray-600 mt-2 truncate">{gm.description}</div>}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded border font-bold ${gm.enabled ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-gray-600 bg-gray-800 border-gray-700"}`}>
                    {gm.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <span className="text-xs text-gray-600">Order: {gm.sortOrder}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
