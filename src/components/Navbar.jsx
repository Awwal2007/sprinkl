import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Gift, Wallet, LogOut, ShieldCheck, Menu, X, Sliders, Info, Headphones, ChevronDown, Settings } from 'lucide-react';
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setAvatarOpen(false);
  }, [location.pathname]);

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
    <header className="sticky top-0 z-40 bg-dark-bg/90 backdrop-blur-md border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
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

        {/* Middle Top Navigation Links */}
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

        {/* Desktop Right Nav */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <>

              {/* Avatar dropdown */}
              <div className="relative border-l border-dark-border pl-3" ref={avatarRef}>
                <button
                  onClick={() => setAvatarOpen((o) => !o)}
                  className="flex items-center gap-1.5 group"
                  aria-label="User menu"
                >
                  {/* Avatar circle with initials */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-xs shadow-md shadow-brand-500/30 group-hover:scale-105 transition-transform ring-2 ring-transparent group-hover:ring-brand-500/40">
                    {user.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${avatarOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown card */}
                {avatarOpen && (
                  <div className="absolute right-0 top-full mt-2.5 w-56 bg-dark-card border border-dark-border rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User info */}
                    <div className="px-4 py-3.5 border-b border-dark-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md flex-shrink-0">
                          {user.fullName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{user.fullName}</p>
                          <p className="text-[11px] text-dark-muted truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2 space-y-0.5">
                      <Link
                        to="/dashboard"
                        onClick={() => setAvatarOpen(false)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <Wallet className="w-4 h-4 text-brand-500" />
                        Dashboard
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setAvatarOpen(false)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        Settings & Profile
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setAvatarOpen(false)}
                          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-semibold text-amber-400 hover:bg-amber-500/10 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => { setAvatarOpen(false); handleLogout(); }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
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

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="sm:hidden fixed inset-0 top-16 bg-slate-950/70 backdrop-blur-xs z-40 animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-down Sheet Menu */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-x-0 top-16 bg-dark-bg/98 backdrop-blur-2xl border-b border-dark-border shadow-2xl shadow-black/80 z-50 px-4 py-4 space-y-3 max-h-[calc(100vh-4rem)] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
          {/* Quick Nav Links */}
          <div className="grid grid-cols-3 gap-2 pb-3 border-b border-dark-border/80">
            <a
              href="/#about"
              onClick={(e) => handleNavClick(e, 'about')}
              className="py-2.5 px-2 text-center rounded-xl bg-dark-card/90 border border-dark-border text-xs font-semibold text-slate-300 hover:text-brand-400 hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Info className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span>About</span>
            </a>
            <a
              href="/#calculator"
              onClick={(e) => handleNavClick(e, 'calculator')}
              className="py-2.5 px-2 text-center rounded-xl bg-dark-card/90 border border-dark-border text-xs font-semibold text-slate-300 hover:text-brand-400 hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Sliders className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Calculator</span>
            </a>
            <button
              onClick={handleContactClick}
              className="py-2.5 px-2 text-center rounded-xl bg-dark-card/90 border border-dark-border text-xs font-semibold text-emerald-400 hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Headphones className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Contact</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </button>
          </div>

          {user ? (
            <div className="space-y-2 pt-1">
              {/* Profile Card */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-dark-card/90 border border-dark-border/80">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shrink-0">
                  {user.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-white truncate">{user.fullName}</p>
                    {user.role === 'admin' ? (
                      <span className="text-[9px] uppercase font-black px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        Admin
                      </span>
                    ) : (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-dark-border shrink-0">
                        Host
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-dark-muted truncate">{user.email}</p>
                </div>
              </div>

              {/* Action Links */}
              <div className="space-y-1.5 pt-1">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl bg-dark-card hover:bg-slate-800 border border-dark-border text-sm font-semibold text-slate-200 transition-colors"
                >
                  <Wallet className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Dashboard</span>
                </Link>

                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 text-sm font-bold text-amber-400 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}

                <Link
                  to="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl bg-dark-card hover:bg-slate-800 border border-dark-border text-sm font-semibold text-slate-200 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Settings & Profile</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-rose-400 text-sm font-bold bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center w-full py-2.5 rounded-xl border border-dark-border text-sm font-bold text-slate-200 bg-dark-card hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center w-full py-2.5 rounded-xl text-slate-950 bg-brand-500 hover:bg-brand-400 font-black text-sm shadow-lg shadow-brand-500/20 transition-colors"
              >
                Get Started — It's Free
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
