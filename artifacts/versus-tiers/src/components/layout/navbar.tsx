import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, Shield, LogOut, User, ChevronDown } from "lucide-react";

export function Navbar() {
  const [location, navigate] = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/leaderboard", label: "Leaderboards" },
    { href: "/search", label: "Search" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-cyan-500/20 bg-black/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="w-8 h-8 bg-cyan-500 rounded-sm flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-300">
                <span className="text-black font-black text-sm -rotate-12 group-hover:rotate-0 transition-transform duration-300">VT</span>
              </div>
              <div className="absolute inset-0 bg-cyan-500/40 rounded-sm blur-md -z-10 group-hover:blur-lg transition-all" />
            </div>
            <span className="font-black text-xl tracking-tight text-white group-hover:text-cyan-400 transition-colors">
              VERSUS <span className="text-cyan-400">TIERS</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                  location === link.href
                    ? "text-cyan-400 bg-cyan-500/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://discord.gg/versustiers"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-md text-sm font-semibold text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all duration-200"
            >
              Discord
            </a>
          </div>

          {/* Search + Auth */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/search" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:border-cyan-500/40 hover:text-white transition-all text-sm">
              <Search size={14} />
              <span>Search players...</span>
              <kbd className="text-xs bg-white/10 px-1.5 py-0.5 rounded text-gray-500">/</kbd>
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all text-sm text-white"
                >
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                    <User size={12} className="text-cyan-400" />
                  </div>
                  <span className="text-cyan-300 font-semibold">{user.username}</span>
                  <ChevronDown size={12} className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-2xl overflow-hidden"
                    >
                      {isAdmin && (
                        <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                          <Shield size={14} />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); navigate("/"); }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors">
                  Login
                </Link>
                <Link href="/auth/register" className="px-4 py-2 text-sm font-bold bg-cyan-500 text-black rounded-lg hover:bg-cyan-400 transition-all duration-200 shadow-lg shadow-cyan-500/25">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 bg-black/90 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-1">
              {links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                    location === link.href ? "text-cyan-400 bg-cyan-500/10" : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-semibold text-cyan-400 hover:bg-cyan-500/10 transition-all">
                      Admin Panel
                    </Link>
                  )}
                  <button onClick={() => { logout(); setMobileOpen(false); navigate("/"); }} className="w-full text-left px-4 py-3 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all">
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center px-4 py-3 rounded-lg text-sm font-semibold border border-white/10 text-gray-300 hover:text-white transition-all">
                    Login
                  </Link>
                  <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center px-4 py-3 rounded-lg text-sm font-bold bg-cyan-500 text-black hover:bg-cyan-400 transition-all">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
