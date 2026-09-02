import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gift, Wallet, LogOut, ShieldCheck, User } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-dark-bg/80 backdrop-blur-md border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Gift className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white">GiveHub</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 border border-brand-500/20">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-dark-muted font-medium -mt-0.5">by Sprinkl.biz</p>
          </div>
        </Link>

        {/* Right Navigation */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-lg bg-dark-card hover:bg-slate-800 border border-dark-border text-sm font-medium text-slate-200 transition-colors"
              >
                <Wallet className="w-4 h-4 text-brand-500" />
                <span>Dashboard</span>
              </Link>

              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin</span>
                </Link>
              )}

              <div className="flex items-center gap-2 border-l border-dark-border pl-3">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-semibold text-slate-200">{user.fullName}</p>
                  <p className="text-[10px] text-dark-muted">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-sm font-semibold text-slate-950 bg-brand-500 hover:bg-brand-600 rounded-lg shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
