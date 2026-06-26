import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CloudBackground } from "@/components/clouds";
import { ClipboardList, Send, CheckCircle, ArrowLeft, Gamepad2, MessageSquare, ExternalLink, User } from "lucide-react";

const GAMEMODES = [
  "Sword", "Axe", "Pot PvP", "Crystal PvP", "Bow", "UHC", "SMP",
  "Shield", "Trident", "Combo", "Kohi", "HCF", "Factions",
];

export default function ApplyPage() {
  const [form, setForm] = useState({
    minecraftUsername: "",
    discord: "",
    gamemodes: [] as string[],
    evidence: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const toggleGamemode = (gm: string) => {
    setForm(prev => ({
      ...prev,
      gamemodes: prev.gamemodes.includes(gm)
        ? prev.gamemodes.filter(g => g !== gm)
        : [...prev.gamemodes, gm],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.minecraftUsername.trim()) { setError("Minecraft username is required"); return; }
    if (!form.discord.trim()) { setError("Discord username is required"); return; }
    if (form.gamemodes.length === 0) { setError("Select at least one gamemode"); return; }
    if (!form.evidence.trim()) { setError("Evidence link is required"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minecraftUsername: form.minecraftUsername.trim(),
          discord: form.discord.trim(),
          gamemodes: form.gamemodes.join(", "),
          evidence: form.evidence.trim(),
          notes: form.notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Submission failed");
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      <CloudBackground />
      <Navbar />

      <main className="relative z-10 pt-28 pb-20 max-w-2xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/">
            <button className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-6 transition-colors">
              <ArrowLeft size={14} /> Back to Home
            </button>
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <ClipboardList size={18} className="text-cyan-400" />
            </div>
            <h1 className="text-3xl font-black text-white">Apply for a Rank</h1>
          </div>
          <p className="text-gray-500 mb-8 ml-13">Submit your application and our staff team will review it.</p>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-green-500/20 bg-green-500/5 p-10 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-400" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Application Submitted!</h2>
                <p className="text-gray-400 mb-6 text-sm max-w-sm mx-auto">
                  Our staff team will review your application and reach out via Discord.
                  This usually takes 1–3 days.
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Link href="/leaderboard">
                    <button className="px-6 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-all text-sm">
                      Browse Leaderboard
                    </button>
                  </Link>
                  <button
                    onClick={() => { setSuccess(false); setForm({ minecraftUsername: "", discord: "", gamemodes: [], evidence: "", notes: "" }); }}
                    className="px-6 py-3 border border-white/10 text-white font-bold rounded-xl hover:border-white/20 transition-all text-sm"
                  >
                    Submit Another
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="rounded-2xl border border-white/5 bg-black/40 backdrop-blur-sm p-6 space-y-5"
              >
                {/* Username */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-300 mb-2">
                    <User size={13} className="text-cyan-400" /> Minecraft Username <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={form.minecraftUsername}
                    onChange={e => setForm(p => ({ ...p, minecraftUsername: e.target.value }))}
                    placeholder="e.g. Notch"
                    className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                {/* Discord */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-300 mb-2">
                    <MessageSquare size={13} className="text-cyan-400" /> Discord Username <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={form.discord}
                    onChange={e => setForm(p => ({ ...p, discord: e.target.value }))}
                    placeholder="e.g. notch#0001 or notch"
                    className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                {/* Gamemodes */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-300 mb-3">
                    <Gamepad2 size={13} className="text-cyan-400" /> Gamemodes <span className="text-red-400">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GAMEMODES.map(gm => (
                      <button
                        key={gm}
                        type="button"
                        onClick={() => toggleGamemode(gm)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          form.gamemodes.includes(gm)
                            ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                            : "border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300"
                        }`}
                      >
                        {gm}
                      </button>
                    ))}
                  </div>
                  {form.gamemodes.length > 0 && (
                    <p className="text-xs text-gray-600 mt-2">Selected: {form.gamemodes.join(", ")}</p>
                  )}
                </div>

                {/* Evidence */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-300 mb-2">
                    <ExternalLink size={13} className="text-cyan-400" /> Evidence (clips, screenshots, links) <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={form.evidence}
                    onChange={e => setForm(p => ({ ...p, evidence: e.target.value }))}
                    placeholder="Paste YouTube/medal.tv links, Imgur, or describe your evidence..."
                    rows={3}
                    className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-300 mb-2">
                    <MessageSquare size={13} className="text-cyan-400" /> Additional Notes <span className="text-gray-600 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Anything else you want us to know..."
                    rows={2}
                    className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Submitting...</>
                  ) : (
                    <><Send size={16} /> Submit Application</>
                  )}
                </button>

                <p className="text-xs text-gray-600 text-center">
                  Applications are reviewed within 1–3 days. Staff will contact you on Discord.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
