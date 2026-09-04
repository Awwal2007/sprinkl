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
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useSupportStore } from '../store/useSupportStore';
import { toast, confirmDialog } from '../store/useNotificationStore';

/** Routes considered "app" / dashboard routes */
const APP_ROUTES = ['/dashboard', '/settings', '/admin'];
const isAppRoute = (pathname) =>
  APP_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { openChat } = useSupportStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef(null);

  const onAppRoute = isAppRoute(location.pathname);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setAvatarOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
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
      if (el) el.scrollIntoView({ behavior: 'smooth' });
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
    setAvatarOpen(false);
    setMobileOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-dark-bg/95 backdrop-blur-md border-b border-dark-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group shrink-0"
            onClick={() => {
              setMobileOpen(false);
              setAvatarOpen(false);
            }}
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

          {/* ══════════════════════════════════════════════════════
              DESKTOP NAVIGATION (>= 768px)
             ══════════════════════════════════════════════════════ */}

          {/* Desktop Public Nav Links (Hidden in dashboard/app routes) */}
          {!onAppRoute && (
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
          )}

          {/* Desktop Right Side (Auth / User profile) */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              /* User Avatar Dropdown (for Desktop) */
              <div className="relative" ref={avatarRef}>
                <button
                  onClick={() => setAvatarOpen((o) => !o)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-dark-card/80 hover:bg-dark-card border border-dark-border hover:border-brand-500/30 transition-all group"
                  aria-label="User menu"
                  aria-expanded={avatarOpen}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-xs shadow-md shadow-brand-500/30 group-hover:scale-105 transition-transform ring-2 ring-transparent group-hover:ring-brand-500/40">
                    {user.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs font-bold text-slate-200 max-w-[120px] truncate">
                    {user.fullName?.split(' ')[0] || 'Account'}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      avatarOpen ? 'rotate-180 text-brand-400' : ''
                    }`}
                  />
                </button>

                {avatarOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 bg-dark-card border border-dark-border rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3.5 border-b border-dark-border bg-dark-bg/50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shrink-0">
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
                        <span>Settings</span>
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

          {/* ══════════════════════════════════════════════════════
              MOBILE NAVIGATION (< 768px)
             ══════════════════════════════════════════════════════ */}
          <div className="flex md:hidden items-center gap-2">
            {onAppRoute ? (
              /* IN DASHBOARD: Profile avatar dropdown only */
              user && (
                <div className="relative" ref={avatarRef}>
                  <button
                    onClick={() => setAvatarOpen((o) => !o)}
                    className="flex items-center gap-1.5 p-1 rounded-full bg-dark-card border border-dark-border active:scale-95 transition-transform"
                    aria-label="User account menu"
                    aria-expanded={avatarOpen}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-xs shadow-md shadow-brand-500/20">
                      {user.fullName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 mr-1 transition-transform duration-200 ${
                        avatarOpen ? 'rotate-180 text-brand-400' : ''
                      }`}
                    />
                  </button>

                  {/* Dashboard Mobile Dropdown */}
                  {avatarOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-dark-card border border-dark-border rounded-2xl shadow-2xl shadow-black/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-3.5 border-b border-dark-border bg-dark-bg/60">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shrink-0">
                            {user.fullName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{user.fullName}</p>
                            <p className="text-xs text-dark-muted truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-2 space-y-1">
                        <Link
                          to="/dashboard"
                          onClick={() => setAvatarOpen(false)}
                          className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
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
                          className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                            location.pathname === '/settings'
                              ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          <span>Settings</span>
                        </Link>

                        {user.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setAvatarOpen(false)}
                            className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
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
                          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              /* ON MAIN WEBSITE: ONLY hamburger menu */
              <button
                className="p-2.5 rounded-xl text-slate-300 hover:text-white bg-dark-card/90 hover:bg-slate-800 border border-dark-border/80 transition-all active:scale-95 shrink-0"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          MAIN WEBSITE MOBILE SLIDE-IN DRAWER
         ══════════════════════════════════════════════════════ */}
      {!onAppRoute && (
        <>
          <div
            className="md:hidden fixed inset-0 top-16 z-40 transition-all duration-300"
            style={{
              pointerEvents: mobileOpen ? 'auto' : 'none',
              opacity: mobileOpen ? 1 : 0,
              background: 'rgba(2, 6, 23, 0.72)',
              backdropFilter: mobileOpen ? 'blur(4px)' : 'none',
              WebkitBackdropFilter: mobileOpen ? 'blur(4px)' : 'none',
            }}
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          <div
            id="mobile-navigation"
            className="md:hidden fixed top-16 right-0 bottom-0 z-50 w-[78%] max-w-xs overflow-y-auto overscroll-contain"
            style={{
              background: 'linear-gradient(165deg, #0f172a 0%, #090e1a 100%)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: mobileOpen ? '-10px 0 40px rgba(0,0,0,0.8)' : 'none',
              transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
              willChange: 'transform',
            }}
            aria-hidden={!mobileOpen}
          >
            <div className="px-4 py-5 space-y-4">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shrink-0">
                      {user.fullName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{user.fullName}</p>
                      <p className="text-[11px] text-dark-muted truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="p-3 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-bold flex items-center gap-2 transition-all hover:bg-brand-500/25"
                    >
                      <Wallet className="w-4 h-4 text-brand-400 shrink-0" />
                      <span>Dashboard</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setMobileOpen(false)}
                      className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-200 text-xs font-bold flex items-center gap-2 transition-all hover:bg-white/[0.08]"
                    >
                      <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Settings</span>
                    </Link>
                  </div>

                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between w-full p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold transition-all hover:bg-amber-500/15"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Admin Panel</span>
                      </div>
                      <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        Staff
                      </span>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center w-full py-3 rounded-xl text-slate-950 bg-brand-500 hover:bg-brand-400 font-black text-xs shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98]"
                  >
                    <span>Get Started — It's Free</span>
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center w-full py-2.5 rounded-xl border border-white/[0.08] text-xs font-bold text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                  >
                    Sign In to Account
                  </Link>
                </div>
              )}

              <div className="pt-3 border-t border-white/[0.08] space-y-2">
                <p className="text-[10px] uppercase font-bold text-dark-muted tracking-widest px-1">
                  Explore Sprinkl
                </p>

                <a
                  href="/#about"
                  onClick={(e) => handleNavClick(e, 'about')}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-xs font-semibold text-slate-200 hover:text-brand-400 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-brand-400" />
                    <span>About Platform</span>
                  </div>
                  <span className="text-[10px] text-dark-muted">Automated</span>
                </a>

                <a
                  href="/#calculator"
                  onClick={(e) => handleNavClick(e, 'calculator')}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-xs font-semibold text-slate-200 hover:text-brand-400 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-teal-400" />
                    <span>Giveaway Calculator</span>
                  </div>
                  <span className="text-[10px] text-dark-muted">ROI Tool</span>
                </a>

                <button
                  onClick={handleContactClick}
                  className="flex items-center justify-between w-full p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-xs font-semibold text-emerald-400 transition-colors text-left"
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

              {user && (
                <div className="pt-2 border-t border-white/[0.08]">
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-rose-400 text-xs font-bold bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 transition-colors active:scale-[0.98]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out of Sprinkl</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
