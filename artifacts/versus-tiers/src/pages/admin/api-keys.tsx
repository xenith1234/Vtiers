import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Key, Plus, Trash2, Copy, Check, ToggleLeft, ToggleRight, X, Eye, EyeOff } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAuth } from "@/lib/auth-context";

interface ApiKey {
  id: number;
  name: string;
  description: string | null;
  key: string;
  active: boolean;
  lastUsed: string | null;
  createdAt: string;
}

function CreateKeyModal({ onClose, onCreated }: { onClose: () => void; onCreated: (key: ApiKey) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("vt_token");
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed to create key");
      const key = await res.json();
      onCreated(key);
      onClose();
    } catch {
      alert("Failed to create API key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-black/90 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black">New API Key</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Key Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="My Discord Bot"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-500/50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Description (optional)</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Used for the official VERSUS TIERS bot"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-500/50" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-all text-sm">Cancel</button>
          <button onClick={handleCreate} disabled={loading || !name.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 disabled:opacity-50 transition-all text-sm">
            <Key size={14} /> Generate Key
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className={`transition-colors ${copied ? "text-green-400" : "text-gray-500 hover:text-white"}`}>
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

export default function AdminApiKeysPage() {
  const [, navigate] = useLocation();
  const { user, isAdmin } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<number>>(new Set());

  const fetchKeys = async () => {
    const token = localStorage.getItem("vt_token");
    const res = await fetch("/api/api-keys", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setKeys(await res.json());
    setLoading(false);
  };

  useState(() => { fetchKeys(); });

  if (!user) { navigate("/auth/login"); return null; }
  if (!isAdmin) { navigate("/"); return null; }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this API key? Any bots using it will stop working.")) return;
    const token = localStorage.getItem("vt_token");
    await fetch(`/api/api-keys/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setKeys(prev => prev.filter(k => k.id !== id));
  };

  const handleToggle = async (id: number, active: boolean) => {
    const token = localStorage.getItem("vt_token");
    const res = await fetch(`/api/api-keys/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: !active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setKeys(prev => prev.map(k => k.id === id ? updated : k));
    }
  };

  const toggleReveal = (id: number) => {
    setRevealedKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const maskKey = (key: string) => key.slice(0, 8) + "•".repeat(24) + key.slice(-6);

  return (
    <AdminLayout title="API Keys">
      {showModal && <CreateKeyModal onClose={() => setShowModal(false)} onCreated={key => setKeys(prev => [key, ...prev])} />}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-500 text-sm">{keys.length} API keys</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-all text-sm">
            <Plus size={16} /> New API Key
          </button>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
          <div className="flex items-start gap-3">
            <Key size={18} className="text-cyan-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-cyan-300 mb-1">Discord Bot Integration</div>
              <div className="text-xs text-gray-400 leading-relaxed">
                Use these keys to connect your Discord bot. Authenticate with{" "}
                <code className="text-cyan-400 bg-white/5 px-1 py-0.5 rounded">Authorization: Bearer &lt;key&gt;</code> header.
              </div>
              <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                <div><span className="text-cyan-500">GET</span> /api/bot/player/:username — Player info + tier</div>
                <div><span className="text-cyan-500">GET</span> /api/bot/tier/:username — Quick tier lookup</div>
                <div><span className="text-cyan-500">GET</span> /api/bot/leaderboard — Top players</div>
                <div><span className="text-cyan-500">GET</span> /api/bot/search?q= — Search players</div>
                <div><span className="text-cyan-500">GET</span> /api/bot/gamemodes — List gamemodes</div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-20 rounded-xl bg-white/2 border border-white/5 animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((k, i) => {
              const revealed = revealedKeys.has(k.id);
              return (
                <motion.div key={k.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-xl border transition-all ${k.active ? "border-white/10 bg-black/40" : "border-white/5 bg-black/20 opacity-60"}`}>
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <Key size={16} className="text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-sm">{k.name}</span>
                        {!k.active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Inactive</span>}
                      </div>
                      {k.description && <div className="text-xs text-gray-500 mb-2">{k.description}</div>}
                      <div className="flex items-center gap-2 font-mono text-xs text-gray-400 bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                        <span className="flex-1 truncate">{revealed ? k.key : maskKey(k.key)}</span>
                        <button onClick={() => toggleReveal(k.id)} className="text-gray-600 hover:text-gray-300 transition-colors flex-shrink-0">
                          {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <CopyButton text={k.key} />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                        <span>Created {new Date(k.createdAt).toLocaleDateString()}</span>
                        {k.lastUsed && <span>Last used {new Date(k.lastUsed).toLocaleString()}</span>}
                        {!k.lastUsed && <span>Never used</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => handleToggle(k.id, k.active)}
                        className={`transition-colors ${k.active ? "text-green-400 hover:text-gray-400" : "text-gray-600 hover:text-green-400"}`}>
                        {k.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                      <button onClick={() => handleDelete(k.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {keys.length === 0 && (
              <div className="text-center py-16 text-gray-600">
                <Key size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-semibold mb-1">No API keys yet</p>
                <p className="text-sm">Create one to connect your Discord bot</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
