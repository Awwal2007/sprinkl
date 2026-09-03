import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Gift, Wallet, LogOut, ShieldCheck, Menu, X, Sliders, Info, Headphones, ChevronDown } from 'lucide-react';
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

      {/* Mobile Slide-down Menu */}
      {mobileOpen && (
        <div className="sm:hidden bg-dark-bg/95 backdrop-blur-md border-t border-dark-border px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {/* Quick Nav Links */}
          <div className="grid grid-cols-3 gap-2 pb-3 mb-3 border-b border-dark-border">
            <a
              href="/#about"
              onClick={(e) => handleNavClick(e, 'about')}
              className="py-2 px-2 text-center rounded-xl bg-dark-card border border-dark-border text-xs font-semibold text-slate-300 hover:text-brand-400 flex items-center justify-center gap-1"
            >
              <Info className="w-3.5 h-3.5 text-brand-400" />
              <span>About</span>
            </a>
            <a
              href="/#calculator"
              onClick={(e) => handleNavClick(e, 'calculator')}
              className="py-2 px-2 text-center rounded-xl bg-dark-card border border-dark-border text-xs font-semibold text-slate-300 hover:text-brand-400 flex items-center justify-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5 text-teal-400" />
              <span>Calculator</span>
            </a>
            <button
              onClick={handleContactClick}
              className="py-2 px-2 text-center rounded-xl bg-dark-card border border-dark-border text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1"
            >
              <Headphones className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contact</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </button>
          </div>

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
