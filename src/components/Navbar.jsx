import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Gift,
  Wallet,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Sliders,
  Info,
  Headphones,
  ChevronDown,
  Settings,
  Plus,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useSupportStore } from '../store/useSupportStore';
import { toast, confirmDialog } from '../store/useNotificationStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { openChat } = useSupportStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef(null);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setAvatarOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [mobileOpen]);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setAvatarOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNavClick = (e, targetId) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(`/#${targetId}`);
    }
    setMobileOpen(false);
  };

  const handleContactClick = (e) => {
    e.preventDefault();
    openChat();
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    const confirmed = await confirmDialog({
      title: 'Sign Out of Sprinkl?',
      message: 'Are you sure you want to end your session?',
      confirmText: 'Sign Out',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;

    logout();
    toast.info('You have been signed out successfully.', 'Signed Out');
    navigate('/login');
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-dark-bg/95 backdrop-blur-md border-b border-dark-border transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 group shrink-0"
          onClick={() => setMobileOpen(false)}
          aria-label="Sprinkl Home"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-slate-950 shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Gift className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-xl tracking-tight text-white">Sprinkl</span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                PRO
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-dark-muted font-medium -mt-0.5 hidden sm:block">
              Sprinkl.biz
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links (Pill Nav) */}
        <nav className="hidden md:flex items-center gap-1 bg-dark-card/80 backdrop-blur-sm border border-dark-border/80 px-3 py-1.5 rounded-full shadow-inner">
          <a
            href="/#about"
            onClick={(e) => handleNavClick(e, 'about')}
            className="px-4 py-1 text-xs font-semibold text-slate-300 hover:text-brand-400 hover:bg-slate-800/80 rounded-full transition-all flex items-center gap-1.5"
          >
            <Info className="w-3.5 h-3.5 text-brand-400" />
            <span>About</span>
          </a>
          <a
            href="/#calculator"
            onClick={(e) => handleNavClick(e, 'calculator')}
            className="px-4 py-1 text-xs font-semibold text-slate-300 hover:text-brand-400 hover:bg-slate-800/80 rounded-full transition-all flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-teal-400" />
            <span>Calculator</span>
          </a>
          <button
            onClick={handleContactClick}
            className="px-4 py-1 text-xs font-semibold text-slate-300 hover:text-brand-400 hover:bg-slate-800/80 rounded-full transition-all flex items-center gap-1.5 group"
          >
            <Headphones className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span>Contact</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </button>
        </nav>

        {/* Desktop Right Nav (Logged In or Out) */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/dashboard/create"
                className="px-3.5 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-[1.02] shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Create Giveaway</span>
              </Link>

              {/* Avatar dropdown */}
              <div className="relative border-l border-dark-border pl-3" ref={avatarRef}>
                <button
                  onClick={() => setAvatarOpen((o) => !o)}
                  className="flex items-center gap-1.5 group"
                  aria-label="User menu"
                  aria-expanded={avatarOpen}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-xs shadow-md shadow-brand-500/30 group-hover:scale-105 transition-transform ring-2 ring-transparent group-hover:ring-brand-500/40">
                    {user.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      avatarOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {avatarOpen && (
                  <div className="absolute right-0 top-full mt-2.5 w-56 bg-dark-card border border-dark-border rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50">
                    <div className="px-4 py-3.5 border-b border-dark-border bg-dark-bg/40">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md flex-shrink-0">
                          {user.fullName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{user.fullName}</p>
                          <p className="text-[11px] text-dark-muted truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 space-y-0.5">
                      <Link
                        to="/dashboard"
                        onClick={() => setAvatarOpen(false)}
                        className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          location.pathname === '/dashboard'
                            ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Wallet className="w-4 h-4 text-brand-500" />
                        <span>Dashboard</span>
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setAvatarOpen(false)}
                        className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          location.pathname === '/settings'
                            ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>Settings & Profile</span>
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setAvatarOpen(false)}
                          className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            location.pathname === '/admin'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'text-amber-400 hover:bg-amber-500/10'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setAvatarOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-xs font-black text-slate-950 bg-brand-500 hover:bg-brand-400 rounded-xl shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Top Bar Actions (< 768px) */}
        <div className="flex md:hidden items-center gap-2">
          {user ? (
            <>
              {/* Quick Create Giveaway Pill */}
              <Link
                to="/dashboard/create"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/25 text-xs font-bold transition-all active:scale-95"
                title="Create Giveaway"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="text-[11px]">Create</span>
              </Link>

              {/* Avatar Toggle Button */}
              <button
                onClick={() => setMobileOpen((o) => !o)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-xs shadow-md shadow-brand-500/20 ring-1 ring-white/20 active:scale-95 transition-transform shrink-0"
                aria-label="Toggle user navigation"
              >
                {user.fullName?.charAt(0).toUpperCase() || 'U'}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-1.5 text-xs font-black text-slate-950 bg-brand-500 hover:bg-brand-400 rounded-lg shadow-sm shadow-brand-500/20 transition-all active:scale-95"
              >
                Get Started
              </Link>
            </>
          )}

          {/* Hamburger Icon Button */}
          <button
            className="p-2 rounded-xl text-slate-300 hover:text-white bg-dark-card/80 hover:bg-slate-800 border border-dark-border/80 transition-all active:scale-95 shrink-0"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 top-16 bg-slate-950/80 backdrop-blur-sm z-40 transition-opacity duration-200"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-down Sheet Menu */}
      {mobileOpen && (
        <div
          id="mobile-navigation"
          className="md:hidden fixed inset-x-0 top-16 bg-dark-bg/98 backdrop-blur-2xl border-b border-dark-border shadow-2xl shadow-black/80 z-50 px-4 py-4 space-y-3.5 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain transition-all duration-200"
        >
          {user ? (
            <div className="space-y-3">
              {/* User Profile Card */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-dark-card/90 border border-dark-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shrink-0">
                    {user.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-white truncate">{user.fullName}</p>
                      {user.role === 'admin' ? (
                        <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                          Admin
                        </span>
                      ) : (
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400 border border-brand-500/25 shrink-0">
                          Host
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-dark-muted truncate mt-0.5">{user.email}</p>
                  </div>
                </div>

                <Link
                  to="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-xl text-dark-muted hover:text-white bg-slate-800/80 border border-dark-border/80 transition-colors shrink-0"
                  title="Account Settings"
                >
                  <Settings className="w-4 h-4" />
                </Link>
              </div>

              {/* Primary Host Action Button */}
              <Link
                to="/dashboard/create"
                onClick={() => setMobileOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-emerald-500 hover:from-brand-400 hover:to-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create New Giveaway</span>
              </Link>

              {/* App Links (2 Column Grid) */}
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 transition-all ${
                    location.pathname === '/dashboard'
                      ? 'bg-brand-500/15 border-brand-500/30 text-brand-300'
                      : 'bg-dark-card border-dark-border text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Wallet className="w-4 h-4 text-brand-400 shrink-0" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setMobileOpen(false)}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 transition-all ${
                    location.pathname === '/settings'
                      ? 'bg-brand-500/15 border-brand-500/30 text-brand-300'
                      : 'bg-dark-card border-dark-border text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Settings & Limit</span>
                </Link>
              </div>

              {/* Admin Panel Link */}
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between w-full p-3 rounded-xl border text-xs font-bold transition-all ${
                    location.pathname === '/admin'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-amber-500/10 border-amber-500/25 text-amber-400 hover:bg-amber-500/15'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Admin Command Center</span>
                  </div>
                  <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    Panel
                  </span>
                </Link>
              )}

              {/* Quick Public Links Grid */}
              <div className="pt-2 border-t border-dark-border/80">
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href="/#about"
                    onClick={(e) => handleNavClick(e, 'about')}
                    className="py-2.5 px-2 rounded-xl bg-dark-card/90 border border-dark-border text-xs font-semibold text-slate-300 hover:text-brand-400 hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 active:scale-95 text-center"
                  >
                    <Info className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                    <span>About</span>
                  </a>
                  <a
                    href="/#calculator"
                    onClick={(e) => handleNavClick(e, 'calculator')}
                    className="py-2.5 px-2 rounded-xl bg-dark-card/90 border border-dark-border text-xs font-semibold text-slate-300 hover:text-brand-400 hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 active:scale-95 text-center"
                  >
                    <Sliders className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Calculator</span>
                  </a>
                  <button
                    onClick={handleContactClick}
                    className="py-2.5 px-2 rounded-xl bg-dark-card/90 border border-dark-border text-xs font-semibold text-emerald-400 hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 active:scale-95 text-center"
                  >
                    <Headphones className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Contact</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                  </button>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-rose-400 text-xs font-bold bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 transition-colors active:scale-[0.98]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Sprinkl</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Primary CTA Buttons */}
              <div className="space-y-2">
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-slate-950 bg-brand-500 hover:bg-brand-400 font-black text-sm shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98]"
                >
                  <span>Get Started — It's Free</span>
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center w-full py-2.5 rounded-xl border border-dark-border text-xs font-bold text-slate-200 bg-dark-card hover:bg-slate-800 transition-colors"
                >
                  Sign In to Existing Account
                </Link>
              </div>

              {/* Quick Links List */}
              <div className="pt-2 border-t border-dark-border/80 space-y-1.5">
                <a
                  href="/#about"
                  onClick={(e) => handleNavClick(e, 'about')}
                  className="flex items-center justify-between p-3 rounded-xl bg-dark-card border border-dark-border text-xs font-semibold text-slate-200 hover:text-brand-400 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-brand-400" />
                    <span>About Sprinkl Platform</span>
                  </div>
                  <span className="text-[10px] text-dark-muted">Automated Payouts</span>
                </a>

                <a
                  href="/#calculator"
                  onClick={(e) => handleNavClick(e, 'calculator')}
                  className="flex items-center justify-between p-3 rounded-xl bg-dark-card border border-dark-border text-xs font-semibold text-slate-200 hover:text-brand-400 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-teal-400" />
                    <span>Giveaway ROI Calculator</span>
                  </div>
                  <span className="text-[10px] text-dark-muted">Estimate Cost</span>
                </a>

                <button
                  onClick={handleContactClick}
                  className="flex items-center justify-between w-full p-3 rounded-xl bg-dark-card border border-dark-border text-xs font-semibold text-emerald-400 hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Headphones className="w-4 h-4 text-emerald-400" />
                    <span>24/7 Live Support Desk</span>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
