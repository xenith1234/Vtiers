import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard, Users, Sword, Trophy, Award, Settings, Megaphone, LogOut,
  ChevronRight, Menu, X, Key, Shield
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/players", label: "Players", icon: Trophy },
  { href: "/admin/gamemodes", label: "Gamemodes", icon: Sword },
  { href: "/admin/rankings", label: "Rankings", icon: Award },
  { href: "/admin/badges", label: "Badges", icon: Shield },
  { href: "/admin/api-keys", label: "API Keys", icon: Key },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
];

function SidebarContent({ location, user, logout, navigate, onClose }: {
  location: string;
  user: any;
  logout: () => void;
  navigate: (to: string) => void;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={onClose}>
          <div className="w-7 h-7 bg-cyan-500 rounded-sm flex items-center justify-center rotate-12">
            <span className="text-black font-black text-xs -rotate-12">VT</span>
          </div>
          <span className="font-black text-sm text-white">VERSUS <span className="text-cyan-400">TIERS</span></span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors lg:hidden">
            <X size={18} />
          </button>
        )}
      </div>
      <div className="px-6 py-2">
        <div className="text-xs text-gray-600 font-semibold uppercase tracking-wider">Admin Panel</div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={16} />
              {item.label}
              {active && <ChevronRight size={12} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-400">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user?.username}</div>
            <div className="text-xs text-gray-600 capitalize">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </>
  );
}

export function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex">
      <aside className="hidden lg:flex w-64 border-r border-white/5 bg-black/60 flex-col flex-shrink-0">
        <SidebarContent location={location} user={user} logout={logout} navigate={navigate} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-white/5 bg-black flex flex-col flex-shrink-0 transition-transform duration-200 lg:hidden ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <SidebarContent location={location} user={user} logout={logout} navigate={navigate} onClose={() => setMobileOpen(false)} />
      </aside>

      <main className="flex-1 overflow-auto min-w-0">
        <div className="border-b border-white/5 px-4 lg:px-8 py-4 bg-black/40 backdrop-blur-sm flex items-center gap-4">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-gray-400 hover:text-white transition-colors">
            <Menu size={20} />
          </button>
          <h1 className="text-xl font-bold text-white">{title}</h1>
        </div>
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
