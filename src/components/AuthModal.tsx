"use client";

import { useState } from "react";
import { X, Mail, Lock, User, Loader2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuth: (email: string, password: string, isSignUp: boolean, name?: string) => Promise<void>;
}

export default function AuthModal({ isOpen, onClose, onAuth }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onAuth(email, password, isSignUp, isSignUp ? name : undefined);
      setName("");
      setEmail("");
      setPassword("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4 glass border border-white/[0.08] rounded-2xl p-6 animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-muted hover:text-white hover:bg-surface-300/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-lg font-display font-semibold text-white mb-1">
          {isSignUp ? "Create Account" : "Sign In"}
        </h2>
        <p className="text-xs text-muted/60 mb-6">
          {isSignUp
            ? "Sign up to save your watchlist and get email alerts"
            : "Sign in to access your watchlist and settings"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-200/80 border border-white/[0.06] focus-within:border-accent/30 transition-colors">
                <User className="w-4 h-4 text-muted/50 shrink-0" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-muted/40 outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-200/80 border border-white/[0.06] focus-within:border-accent/30 transition-colors">
              <Mail className="w-4 h-4 text-muted/50 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-muted/40 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-200/80 border border-white/[0.06] focus-within:border-accent/30 transition-colors">
              <Lock className="w-4 h-4 text-muted/50 shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-muted/40 outline-none"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-severity-high/80 bg-severity-high/10 border border-severity-high/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-accent/80 hover:bg-accent text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : isSignUp ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted/50 mt-4">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-accent-glow/80 hover:text-accent-glow transition-colors"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
