import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Save } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAuth } from "@/lib/auth-context";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import type { SiteSettings } from "@workspace/api-client-react/src/generated/api.schemas";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
  const [, navigate] = useLocation();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: settings } = useGetSettings(undefined, { query: { queryKey: getGetSettingsQueryKey() } });
  const updateMutation = useUpdateSettings();
  const [form, setForm] = useState<Partial<SiteSettings>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  if (!user) { navigate("/auth/login"); return null; }
  if (!isAdmin) { navigate("/"); return null; }

  const handleSave = async () => {
    await updateMutation.mutateAsync({ data: form });
    qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
    toast({ title: "Settings saved", description: "Site settings have been updated." });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Field = ({ k, label, type = "text", placeholder = "" }: { k: keyof SiteSettings; label: string; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">{label}</label>
      {type === "checkbox" ? (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={!!(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.checked }))} className="w-4 h-4 rounded" />
          <span className="text-sm text-gray-300">Enabled</span>
        </label>
      ) : (
        <input
          type={type}
          value={(form as any)[k] || ""}
          onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-500/50"
        />
      )}
    </div>
  );

  return (
    <AdminLayout title="Site Settings">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
        <div className="space-y-6">
          <div className="rounded-xl border border-white/5 bg-black/40 p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">General</h2>
            <div className="space-y-4">
              <Field k="siteName" label="Site Name" placeholder="VERSUS TIERS" />
              <Field k="siteDescription" label="Site Description" placeholder="The Ultimate Minecraft PvP Tier Rankings" />
              <Field k="discordInvite" label="Discord Invite URL" placeholder="https://discord.gg/..." />
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/40 p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Homepage</h2>
            <div className="space-y-4">
              <Field k="homepageTitle" label="Hero Title" placeholder="The Ultimate Minecraft PvP Tier Rankings" />
              <Field k="homepageSubtitle" label="Hero Subtitle" placeholder="Compete. Rank. Dominate." />
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/40 p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Announcement Banner</h2>
            <div className="space-y-4">
              <Field k="announcementBannerEnabled" label="Enable Banner" type="checkbox" />
              <Field k="announcementBannerText" label="Banner Text" placeholder="Season 2 has started! New tiers available." />
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/40 p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Appearance</h2>
            <div className="space-y-4">
              <Field k="primaryColor" label="Primary Color" type="color" />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 disabled:opacity-50 transition-all"
          >
            {updateMutation.isPending ? (
              <span className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
            ) : (
              <Save size={18} />
            )}
            {saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
