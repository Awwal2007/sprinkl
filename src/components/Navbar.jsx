import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gift, Wallet, LogOut, ShieldCheck, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-dark-bg/90 backdrop-blur-md border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0" onClick={() => setMobileOpen(false)}>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-slate-950 shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Gift className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">Sprinkl</span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 border border-brand-500/20">PRO</span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-dark-muted font-medium -mt-0.5 hidden xs:block">Sprinkl.biz</p>
          </div>
        </Link>

        {/* Desktop Right Nav */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-dark-card hover:bg-slate-800 border border-dark-border text-sm font-medium text-slate-200 transition-colors"
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
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
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

        {/* Mobile Hamburger */}
        <button
          className="sm:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle mobile menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Slide-down Menu */}
      {mobileOpen && (
        <div className="sm:hidden bg-dark-bg/95 backdrop-blur-md border-t border-dark-border px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {user ? (
            <>
              <div className="px-2 py-2 border-b border-dark-border mb-3">
                <p className="text-sm font-bold text-white">{user.fullName}</p>
                <p className="text-xs text-dark-muted">{user.email}</p>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-xl bg-dark-card border border-dark-border text-sm font-medium text-slate-200"
              >
                <Wallet className="w-4 h-4 text-brand-500" />
                Dashboard
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm font-semibold text-amber-400"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-rose-400 text-sm font-semibold bg-rose-500/5 border border-rose-500/20"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center w-full py-3 rounded-xl border border-dark-border text-sm font-semibold text-slate-200 bg-dark-card"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center w-full py-3 rounded-xl text-slate-950 bg-brand-500 font-extrabold text-sm shadow-lg shadow-brand-500/20"
              >
                Get Started — It's Free
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
