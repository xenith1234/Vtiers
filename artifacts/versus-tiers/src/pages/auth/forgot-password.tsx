import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { CloudBackground } from "@/components/clouds";
import { useForgotPassword } from "@workspace/api-client-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const mutation = useForgotPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutation.mutateAsync({ data: { email } });
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex items-center justify-center px-4">
      <CloudBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center rotate-12">
              <span className="text-black font-black -rotate-12">VT</span>
            </div>
            <span className="font-black text-2xl text-white">VERSUS <span className="text-cyan-400">TIERS</span></span>
          </Link>
        </div>

        <div className="rounded-2xl border border-cyan-500/10 bg-black/60 backdrop-blur-xl p-8 shadow-2xl">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-cyan-400" />
              </div>
              <h2 className="text-xl font-black mb-2">Check your email</h2>
              <p className="text-gray-500 text-sm mb-6">If that email exists in our system, we've sent a reset link.</p>
              <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-semibold">
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-black mb-2">Reset Password</h2>
              <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 disabled:opacity-50 transition-all"
                >
                  {mutation.isPending ? <span className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full" /> : "Send Reset Link"}
                </button>
              </form>
              <div className="mt-4 text-center">
                <Link href="/auth/login" className="text-sm text-gray-600 hover:text-white transition-colors">
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
