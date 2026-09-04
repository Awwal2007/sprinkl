import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Wallet,
  LogOut,
  Settings,
  KeyRound,
  ArrowUpRight,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import PaymentThresholdModal from '../components/PaymentThresholdModal';
import api from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from '../store/useNotificationStore';
import SEO from '../components/SEO';

// Tab IDs
const TABS = ['profile', 'security'];

function TabButton({ id, activeTab, setActiveTab, icon: Icon, label }) {
  const active = activeTab === id;
  return (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        active
          ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

export default function SettingsPage() {
  const { user, setAuth, logout } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');

  // Profile fields
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showThresholdModal, setShowThresholdModal] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(false);
    try {
      const res = await api.patch('/auth/profile', { fullName, phone });
      // Update auth store
      setAuth(
        { ...user, fullName: res.data.user.fullName, phone: res.data.user.phone },
        useAuthStore.getState().accessToken,
        useAuthStore.getState().refreshToken
      );
      setProfileSuccess(true);
      toast.success('Profile updated successfully!', 'Saved');
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile', 'Error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.', 'Validation Error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.', 'Validation Error');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.patch('/auth/profile', { currentPassword, newPassword });
      toast.success('Password changed successfully! Please sign in again.', 'Password Updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Log user out after password change (all sessions invalidated)
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password', 'Error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.info('Signed out successfully.', 'Goodbye');
    navigate('/login');
  };

  // Initials for avatar
  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg text-slate-100">
      <SEO
        title="Settings & Profile — Sprinkl"
        description="Manage your account profile, security preferences, and payout thresholds."
        canonical="/settings"
        noIndex={true}
      />
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-7">
          <Link
            to="/dashboard"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand-400" />
              Account Settings
            </h1>
            <p className="text-xs text-dark-muted mt-0.5">Manage your profile, security, and preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            {/* Avatar card */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-5 mb-4 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-xl shadow-brand-500/20">
                {initials}
              </div>
              <p className="font-bold text-white text-sm truncate">{user?.fullName}</p>
              <p className="text-xs text-dark-muted truncate mt-0.5">{user?.email}</p>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                {user?.emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    Unverified
                  </span>
                )}
                {user?.role === 'admin' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <ShieldCheck className="w-3 h-3" />
                    Admin
                  </span>
                )}
              </div>
            </div>

            {/* Nav */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-3 space-y-1">
              <TabButton id="profile" activeTab={activeTab} setActiveTab={setActiveTab} icon={User} label="Profile" />
              <TabButton id="security" activeTab={activeTab} setActiveTab={setActiveTab} icon={KeyRound} label="Security" />
              <div className="pt-1 border-t border-dark-border mt-1">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                >
                  <Wallet className="w-4 h-4" />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </aside>

          {/* Main panel */}
          <div className="lg:col-span-3">
            {/* ── Profile Tab ── */}
            {activeTab === 'profile' && (
              <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-dark-border flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-400" />
                  <h2 className="font-bold text-white text-sm">Personal Information</h2>
                </div>

                <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="settings-name">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="settings-name"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-dark-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                          placeholder="Your full name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="settings-phone">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="settings-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-dark-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                          placeholder="+234 801 234 5678"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email Address
                      <span className="ml-2 text-dark-muted font-normal">(Cannot be changed)</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        disabled
                        value={user?.email || ''}
                        className="w-full bg-slate-900/50 border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-dark-muted cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Payment Threshold info */}
                  <div className="p-4 rounded-xl bg-dark-bg border border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-brand-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white">Payment Threshold</p>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                            ₦{((user?.kyc?.payoutReviewThreshold || 50000000) / 100).toLocaleString()} / drop
                          </span>
                        </div>
                        <p className="text-[11px] text-dark-muted mt-1">
                          Current single-giveaway payout limit. High-volume giveaways above this amount require a threshold upgrade.
                        </p>
                        {user?.kyc?.requestStatus === 'pending' && (
                          <span className="inline-block mt-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                            Pending request for ₦{((user?.kyc?.requestedThreshold || 0) / 100).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowThresholdModal(true)}
                      className="self-start sm:self-center px-3.5 py-2 rounded-xl bg-dark-card hover:bg-slate-800 border border-dark-border text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Request Increase</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-1">
                    {profileSuccess && (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Saved!
                      </span>
                    )}
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {profileLoading ? (
                        <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      ) : null}
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── Security Tab ── */}
            {activeTab === 'security' && (
              <div className="space-y-5">
                {/* Change password */}
                <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-dark-border flex items-center gap-2">
                    <Lock className="w-4 h-4 text-brand-400" />
                    <h2 className="font-bold text-white text-sm">Change Password</h2>
                  </div>

                  <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                    {/* Current password */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="cur-password">
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="cur-password"
                          type={showCurrent ? 'text' : 'password'}
                          required
                          autoComplete="current-password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-12 py-2.5 text-sm text-white placeholder-dark-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrent((v) => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-muted hover:text-slate-300 transition-colors"
                          aria-label="Toggle current password visibility"
                        >
                          {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New password */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="sec-new-password">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="sec-new-password"
                          type={showNew ? 'text' : 'password'}
                          required
                          minLength={8}
                          autoComplete="new-password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-12 py-2.5 text-sm text-white placeholder-dark-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                          placeholder="Min. 8 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew((v) => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-muted hover:text-slate-300 transition-colors"
                          aria-label="Toggle new password visibility"
                        >
                          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {/* Strength bar */}
                      <div className="mt-2 flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all ${
                              newPassword.length >= i * 3
                                ? newPassword.length >= 12
                                  ? 'bg-emerald-400'
                                  : newPassword.length >= 8
                                  ? 'bg-brand-400'
                                  : 'bg-amber-400'
                                : 'bg-dark-border'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Confirm new password */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="sec-confirm-password">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="sec-confirm-password"
                          type={showConfirm ? 'text' : 'password'}
                          required
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full bg-dark-bg border rounded-xl pl-10 pr-12 py-2.5 text-sm text-white placeholder-dark-muted focus:outline-none transition-colors ${
                            confirmPassword && confirmPassword !== newPassword
                              ? 'border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                              : 'border-dark-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30'
                          }`}
                          placeholder="Repeat new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-muted hover:text-slate-300 transition-colors"
                          aria-label="Toggle confirm password visibility"
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmPassword && confirmPassword !== newPassword && (
                        <p className="text-[11px] text-rose-400 mt-1">Passwords do not match</p>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 flex items-start gap-2 text-[11px] text-amber-300">
                      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                      Changing your password will sign you out of all active sessions.
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={passwordLoading || (confirmPassword && confirmPassword !== newPassword)}
                        className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all disabled:opacity-50"
                      >
                        {passwordLoading ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                        Update Password
                      </button>
                    </div>
                  </form>
                </div>

                {/* Session / account info */}
                <div className="bg-dark-card border border-dark-border rounded-2xl p-5">
                  <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-brand-400" />
                    Account & Session Info
                  </h3>
                  <div className="space-y-2 text-xs text-dark-muted">
                    <div className="flex justify-between items-center">
                      <span>Account Role</span>
                      <span className="capitalize font-semibold text-slate-300">{user?.role}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Email Verified</span>
                      <span className={`font-semibold ${user?.emailVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {user?.emailVerified ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Payment Threshold</span>
                      <span className="font-mono font-semibold text-slate-300">
                        ₦{((user?.kyc?.payoutReviewThreshold || 50000000) / 100).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-dark-border">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-sm font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out of All Devices
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <PaymentThresholdModal
        isOpen={showThresholdModal}
        onClose={() => setShowThresholdModal(false)}
        targetAmount={((user?.kyc?.payoutReviewThreshold || 50000000) / 100) * 2}
        currency="NGN"
      />
    </div>
  );
}
