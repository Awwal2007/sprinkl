import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  User,
  MessageSquare,
  Gift,
  Coins,
  Send,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
  ExternalLink,
  Bot,
  UserCheck,
  TrendingUp,
  FileText,
  DollarSign,
  Users,
  Award,
  Activity,
  Layers,
  Shield,
  HelpCircle,
  ShieldAlert,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import api from '../api/client';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import TableSkeleton, { MobileCardSkeleton } from '../components/TableSkeleton';
import { toast, confirmDialog } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import socket, { joinAdminRoom } from '../lib/socket';

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  // Active Main Navigation Tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'support' | 'giveaways' | 'transactions' | 'claims' | 'users' | 'kyc'

  // ──────────────────────────────────────────────
  // 1. OVERVIEW & REPORTS DATA
  // ──────────────────────────────────────────────
  const { data: reportData, isLoading: reportsLoading, refetch: refetchReports } = useQuery({
    queryKey: ['adminReports'],
    queryFn: async () => {
      const res = await api.get('/admin/overview');
      return res.data;
    },
    refetchInterval: 30000,
  });

  // Flagged accounts
  const { data: flagData, isLoading: flagsLoading, refetch: refetchFlags } = useQuery({
    queryKey: ['adminFlags'],
    queryFn: async () => {
      const res = await api.get('/admin/flags');
      return res.data.flagged;
    },
  });

  // ──────────────────────────────────────────────
  // 2. LIVE SUPPORT CHAT DESK STATE & QUERIES
  // ──────────────────────────────────────────────
  const [supportStatusFilter, setSupportStatusFilter] = useState('all'); // 'all' | 'active' | 'closed' | 'needs_agent'
  const [supportSearch, setSupportSearch] = useState('');
  const [supportPage, setSupportPage] = useState(1);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isClosingSession, setIsClosingSession] = useState(false);
  const messagesEndRef = useRef(null);

  // Read URL query params on mount (e.g. ?tab=support&session=xyz)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const sessionParam = params.get('session');
    if (tabParam) setActiveTab(tabParam);
    if (sessionParam) setSelectedSessionId(sessionParam);
  }, []);

  // ── Real-time Socket.IO: join admins room for instant push updates ──
  useEffect(() => {
    const { accessToken } = useAuthStore.getState();
    joinAdminRoom(accessToken);

    const handleNewMessage = ({ session }) => {
      // Refresh the sessions list and selected thread immediately
      queryClient.invalidateQueries({ queryKey: ['adminSupportSessions'] });
      if (session?.sessionId) {
        queryClient.invalidateQueries({ queryKey: ['adminSessionMessages', session.sessionId] });
      }
    };

    const handleSessionClosed = ({ sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['adminSupportSessions'] });
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: ['adminSessionMessages', sessionId] });
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('session_closed', handleSessionClosed);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('session_closed', handleSessionClosed);
    };
  }, [queryClient]);

  const { data: supportSessionsData, refetch: refetchSupportSessions } = useQuery({
    queryKey: ['adminSupportSessions', supportPage, supportStatusFilter, supportSearch],
    queryFn: async () => {
      const res = await api.get('/admin/support/sessions', {
        params: {
          page: supportPage,
          limit: 12,
          status: supportStatusFilter,
          search: supportSearch,
        },
      });
      return res.data;
    },
    // No polling — socket invalidates on new messages
    refetchInterval: false,
  });

  // Auto-select first session if none selected
  useEffect(() => {
    if (!selectedSessionId && supportSessionsData?.sessions?.length > 0) {
      setSelectedSessionId(supportSessionsData.sessions[0].sessionId);
    }
  }, [supportSessionsData, selectedSessionId]);

  // Selected Session Message Thread
  const { data: selectedSessionData, refetch: refetchSelectedSession } = useQuery({
    queryKey: ['adminSessionMessages', selectedSessionId],
    queryFn: async () => {
      if (!selectedSessionId) return null;
      const res = await api.get(`/admin/support/sessions/${selectedSessionId}`);
      return res.data;
    },
    enabled: !!selectedSessionId,
    // No polling — socket invalidates on new messages
    refetchInterval: false,
  });

  // Scroll chat to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedSessionData?.messages]);

  const handleSendAdminReply = async (e) => {
    e?.preventDefault();
    if (!adminReplyText.trim() || !selectedSessionId || isSendingReply) return;

    setIsSendingReply(true);
    try {
      await api.post(`/admin/support/sessions/${selectedSessionId}/reply`, {
        text: adminReplyText.trim(),
      });
      setAdminReplyText('');
      refetchSelectedSession();
      refetchSupportSessions();
      toast.success('Reply dispatched to user', 'Message Delivered');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to dispatch reply', 'Error');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleCloseSupportSession = async () => {
    if (!selectedSessionId || isClosingSession) return;

    const confirmed = await confirmDialog({
      title: 'End Support Session?',
      message: 'This will close the chat session, purge all uploaded session attachments, and notify the user.',
      confirmText: 'Yes, Close Session',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;

    setIsClosingSession(true);
    try {
      await api.post(`/admin/support/sessions/${selectedSessionId}/close`);
      toast.success('Support session closed and attachments erased', 'Session Closed');
      refetchSelectedSession();
      refetchSupportSessions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to close session', 'Error');
    } finally {
      setIsClosingSession(false);
    }
  };

  // ──────────────────────────────────────────────
  // 3. GIVEAWAYS MONITOR STATE & QUERY
  // ──────────────────────────────────────────────
  const [giveawayPage, setGiveawayPage] = useState(1);
  const [giveawayStatusFilter, setGiveawayStatusFilter] = useState('all');
  const [giveawayCurrencyFilter, setGiveawayCurrencyFilter] = useState('all');
  const [giveawaySearch, setGiveawaySearch] = useState('');

  const { data: giveawaysData, isLoading: giveawaysLoading, refetch: refetchGiveaways } = useQuery({
    queryKey: ['adminGiveaways', giveawayPage, giveawayStatusFilter, giveawayCurrencyFilter, giveawaySearch],
    queryFn: async () => {
      const res = await api.get('/admin/giveaways', {
        params: {
          page: giveawayPage,
          limit: 10,
          status: giveawayStatusFilter,
          currency: giveawayCurrencyFilter,
          search: giveawaySearch,
        },
      });
      return res.data;
    },
    enabled: activeTab === 'giveaways',
  });

  // ──────────────────────────────────────────────
  // 4. PROVIDER TRANSACTIONS STATE & QUERY
  // ──────────────────────────────────────────────
  const [txPage, setTxPage] = useState(1);
  const [txProviderFilter, setTxProviderFilter] = useState('all');
  const [txStatusFilter, setTxStatusFilter] = useState('all');
  const [txDirectionFilter, setTxDirectionFilter] = useState('all');
  const [txSearch, setTxSearch] = useState('');

  const { data: txData, isLoading: txLoading, refetch: refetchTx } = useQuery({
    queryKey: ['adminTransactions', txPage, txProviderFilter, txStatusFilter, txDirectionFilter, txSearch],
    queryFn: async () => {
      const res = await api.get('/admin/transactions', {
        params: {
          page: txPage,
          limit: 12,
          provider: txProviderFilter,
          status: txStatusFilter,
          direction: txDirectionFilter,
          search: txSearch,
        },
      });
      return res.data;
    },
    enabled: activeTab === 'transactions' || activeTab === 'overview',
  });

  // ──────────────────────────────────────────────
  // 5. CLAIMS & WINNERS STATE & QUERY
  // ──────────────────────────────────────────────
  const [claimPage, setClaimPage] = useState(1);
  const [claimStatusFilter, setClaimStatusFilter] = useState('all');
  const [claimCurrencyFilter, setClaimCurrencyFilter] = useState('all');
  const [claimSearch, setClaimSearch] = useState('');

  const { data: claimsData, isLoading: claimsLoading, refetch: refetchClaims } = useQuery({
    queryKey: ['adminClaims', claimPage, claimStatusFilter, claimCurrencyFilter, claimSearch],
    queryFn: async () => {
      const res = await api.get('/admin/claims', {
        params: {
          page: claimPage,
          limit: 12,
          status: claimStatusFilter,
          currency: claimCurrencyFilter,
          search: claimSearch,
        },
      });
      return res.data;
    },
    enabled: activeTab === 'claims',
  });

  // ──────────────────────────────────────────────
  // 6. USERS & KYC DIRECTORY STATE & QUERY
  // ──────────────────────────────────────────────
  const [userPage, setUserPage] = useState(1);
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');

  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['adminUsers', userPage, userRoleFilter, userSearch],
    queryFn: async () => {
      const res = await api.get('/admin/users', {
        params: {
          page: userPage,
          limit: 12,
          role: userRoleFilter,
          search: userSearch,
        },
      });
      return res.data;
    },
    enabled: activeTab === 'users',
  });

  const handleToggleUserRole = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'host' : 'admin';
    const confirmed = await confirmDialog({
      title: `${newRole === 'admin' ? 'Promote' : 'Demote'} ${targetUser.fullName}?`,
      message: `Are you sure you want to change role to "${newRole.toUpperCase()}"? ${
        newRole === 'admin'
          ? 'This will grant full administrative access to financial logs and live support.'
          : 'This will revoke admin portal privileges.'
      }`,
      confirmText: `Yes, Set as ${newRole}`,
      confirmVariant: newRole === 'admin' ? 'brand' : 'danger',
    });
    if (!confirmed) return;

    try {
      await api.patch(`/admin/users/${targetUser._id}/role`, { role: newRole });
      toast.success(`${targetUser.fullName} is now ${newRole}`, 'Role Updated');
      refetchUsers();
      refetchReports();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role', 'Error');
    }
  };

  // ──────────────────────────────────────────────
  // 7. KYC REQUESTS STATE & QUERY
  // ──────────────────────────────────────────────
  const [kycStatusFilter, setKycStatusFilter] = useState('pending');
  const [kycPage, setKycPage] = useState(1);
  const [editingThresholdUserId, setEditingThresholdUserId] = useState(null);
  const [editingThresholdValue, setEditingThresholdValue] = useState('');

  const { data: kycRequestsData, isLoading: kycRequestsLoading, refetch: refetchKycRequests } = useQuery({
    queryKey: ['adminKycRequests', kycPage, kycStatusFilter],
    queryFn: async () => {
      const res = await api.get('/admin/kyc-requests', {
        params: { page: kycPage, limit: 10, status: kycStatusFilter },
      });
      return res.data;
    },
    enabled: activeTab === 'kyc',
  });

  const handleKycReview = async (userId, action, newThreshold) => {
    const label = action === 'approve' ? 'Approve' : 'Reject';
    const confirmed = await confirmDialog({
      title: `${label} Payment Threshold Request?`,
      message:
        action === 'approve'
          ? `This will raise the user's single-giveaway payment threshold to ₦${((newThreshold || 0) / 100).toLocaleString()}.`
          : 'This will reject the user\'s payment threshold upgrade request.',
      confirmText: `Yes, ${label}`,
      confirmVariant: action === 'approve' ? 'brand' : 'danger',
    });
    if (!confirmed) return;

    try {
      await api.patch(`/admin/users/${userId}/threshold-review`, { action, newThreshold });
      toast.success(`Payment threshold request ${action === 'approve' ? 'approved' : 'rejected'}`, 'Threshold Updated');
      refetchKycRequests();
      refetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to process request', 'Error');
    }
  };

  const handleUpdateThresholdDirectly = async (userId) => {
    const amt = parseFloat(editingThresholdValue);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid threshold in Naira.', 'Validation');
      return;
    }
    try {
      // Convert naira to kobo
      await api.patch(`/admin/users/${userId}/threshold`, { newThreshold: Math.round(amt * 100) });
      toast.success('Payment threshold updated', 'Saved');
      setEditingThresholdUserId(null);
      setEditingThresholdValue('');
      refetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update threshold', 'Error');
    }
  };


  const formatCurrency = (amount, currency) => {
    if (currency === 'NGN') {
      return `₦${((amount || 0) / 100).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } else {
      return `$${((amount || 0) / 1000000).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} USDT`;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg text-slate-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 w-full space-y-4 sm:space-y-6">
        {/* Top Header & Admin Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-dark-border/70">
          <div className="flex items-start justify-between gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-brand-500/20 shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h1 className="text-base sm:text-2xl font-black text-white tracking-tight truncate sm:whitespace-normal">
                    Sprinkl Command Center
                  </h1>
                  <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                    Platform Admin
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-dark-muted mt-0.5 leading-relaxed hidden sm:block">
                  Full platform tracking &bull; Live human chat desk &bull; AML &amp; Ledger audits
                </p>
              </div>
            </div>

            {/* Mobile Refresh Icon Button */}
            <button
              onClick={() => {
                refetchReports();
                refetchSupportSessions();
                refetchGiveaways();
                refetchTx();
                refetchClaims();
                refetchUsers();
                toast.success('Refreshed all platform feeds', 'Data Updated');
              }}
              className="sm:hidden p-2.5 bg-dark-card hover:bg-slate-800 border border-dark-border rounded-xl text-slate-300 hover:text-white transition-all shadow-sm shrink-0 active:scale-95"
              title="Refresh feeds"
              aria-label="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile subtext */}
          <p className="text-[11px] text-dark-muted leading-relaxed sm:hidden -mt-1">
            Full platform tracking &bull; Live human chat desk &bull; AML &amp; Ledger audits
          </p>

          {/* Desktop Refresh Button */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                refetchReports();
                refetchSupportSessions();
                refetchGiveaways();
                refetchTx();
                refetchClaims();
                refetchUsers();
                toast.success('Refreshed all platform feeds', 'Data Updated');
              }}
              className="px-3.5 py-2 bg-dark-card hover:bg-slate-800 border border-dark-border rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Feeds</span>
            </button>
          </div>
        </div>

        {/* ─── Navigation Tabs Bar (Horizontal scroll on mobile) ─── */}
        <div className="flex overflow-x-auto no-scrollbar gap-1.5 p-1.5 bg-dark-card/60 border border-dark-border/80 rounded-2xl overscroll-x-contain touch-pan-x scroll-smooth">
          {[
            { id: 'overview', label: 'Overview & Reports', icon: TrendingUp },
            {
              id: 'support',
              label: 'Live Support Desk',
              icon: MessageSquare,
              badge: reportData?.support?.active || 0,
            },
            {
              id: 'giveaways',
              label: 'Giveaways Monitor',
              icon: Gift,
              badge: reportData?.giveaways?.active || 0,
            },
            { id: 'transactions', label: 'Provider Transactions', icon: Activity },
            { id: 'claims', label: 'Claims & Winners', icon: Award },
            { id: 'users', label: 'Users Directory', icon: Users },
            {
              id: 'kyc',
              label: 'Payment Thresholds',
              icon: ShieldAlert,
              badge: kycRequestsData?.requests?.filter((r) => r.kyc?.requestStatus === 'pending')?.length || 0,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-slate-950 text-white' : 'bg-brand-500/20 text-brand-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            TAB 1: OVERVIEW & SYSTEM REPORTS
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
            {/* Platform Revenue & Disbursed Volume KPIs */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* NGN Revenue */}
              <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 blur-2xl pointer-events-none" />
                <p className="text-[11px] uppercase tracking-wider text-dark-muted font-bold mb-1">
                  NGN Platform Fee Profit
                </p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {formatCurrency(reportData?.revenue?.NGN || 0, 'NGN')}
                </p>
                <p className="text-[11px] text-dark-muted mt-2">
                  Payout volume: <strong className="text-slate-200">{formatCurrency(reportData?.payouts?.NGN || 0, 'NGN')}</strong>
                </p>
              </div>

              {/* USDT Revenue */}
              <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/5 blur-2xl pointer-events-none" />
                <p className="text-[11px] uppercase tracking-wider text-dark-muted font-bold mb-1">
                  USDT Platform Fee Profit
                </p>
                <p className="text-2xl sm:text-3xl font-black text-cyan-400">
                  {formatCurrency(reportData?.revenue?.USDT || 0, 'USDT')}
                </p>
                <p className="text-[11px] text-dark-muted mt-2">
                  Payout volume: <strong className="text-slate-200">{formatCurrency(reportData?.payouts?.USDT || 0, 'USDT')}</strong>
                </p>
              </div>

              {/* Campaigns & Conversion */}
              <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-28 h-28 bg-brand-500/5 blur-2xl pointer-events-none" />
                <p className="text-[11px] uppercase tracking-wider text-dark-muted font-bold mb-1">
                  Campaigns &amp; Claims
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl sm:text-3xl font-black text-white">
                    {reportData?.giveaways?.total || 0}
                  </p>
                  <span className="text-xs font-bold text-brand-400">
                    ({reportData?.giveaways?.active || 0} active)
                  </span>
                </div>
                <p className="text-[11px] text-dark-muted mt-2">
                  Slots: <strong className="text-slate-200">{reportData?.giveaways?.totalSlotsClaimed || 0} / {reportData?.giveaways?.totalSlots || 0}</strong> ({reportData?.giveaways?.claimRate || 0}% conversion)
                </p>
              </div>

              {/* Users & Live Support Desk */}
              <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/5 blur-2xl pointer-events-none" />
                <p className="text-[11px] uppercase tracking-wider text-dark-muted font-bold mb-1">
                  Registered Users &amp; Queue
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl sm:text-3xl font-black text-white">
                    {reportData?.users?.total || 0}
                  </p>
                  <span className="text-xs text-dark-muted">
                    ({reportData?.users?.verified || 0} verified)
                  </span>
                </div>
                <p className="text-[11px] text-brand-400 mt-2 font-bold">
                  {reportData?.support?.active || 0} active support chat(s)
                </p>
              </div>
            </section>

            {/* Flagged High-Volume Host Accounts */}
            <section className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <h2 className="text-lg font-bold text-white">
                    Flagged High-Volume Host Accounts (AML Review)
                  </h2>
                </div>
                <span className="text-xs text-dark-muted">
                  Threshold: ₦500,000 / $1,000 USDT
                </span>
              </div>

              {flagsLoading ? (
                <div className="space-y-4">
                  <div className="sm:hidden">
                    <MobileCardSkeleton count={3} />
                  </div>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-dark-muted">
                          <th className="py-2.5 px-3">Host Name</th>
                          <th className="py-2.5 px-3">Email</th>
                          <th className="py-2.5 px-3">NGN Paid Out</th>
                          <th className="py-2.5 px-3">USDT Paid Out</th>
                          <th className="py-2.5 px-3 text-right">Payment Threshold Audit</th>
                        </tr>
                      </thead>
                      <TableSkeleton rows={3} cols={5} colWidths={['w-32', 'w-44', 'w-24', 'w-24', 'w-28']} />
                    </table>
                  </div>
                </div>
              ) : flagData && flagData.length > 0 ? (
                <>
                  {/* Mobile Cards */}
                  <div className="sm:hidden space-y-3">
                    {flagData.map((f) => (
                      <div key={f.user._id} className="bg-dark-bg rounded-xl border border-dark-border p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white">{f.user.fullName}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              f.isFlagged
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {f.isFlagged ? 'FLAGGED' : 'NORMAL'}
                          </span>
                        </div>
                        <p className="text-xs text-dark-muted">{f.user.email}</p>
                        <div className="flex gap-4 text-xs font-mono">
                          <span>NGN: <strong className="text-slate-200">₦{(f.stats.totalNgnPaid / 100).toLocaleString()}</strong></span>
                          <span>USDT: <strong className="text-slate-200">{(f.stats.totalUsdtPaid / 1000000).toLocaleString()}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-dark-muted">
                          <th className="py-2.5 px-3">Host Name</th>
                          <th className="py-2.5 px-3">Email</th>
                          <th className="py-2.5 px-3">NGN Paid Out</th>
                          <th className="py-2.5 px-3">USDT Paid Out</th>
                          <th className="py-2.5 px-3 text-right">Payment Threshold Audit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-border text-xs">
                        {flagData.map((f) => (
                          <tr key={f.user._id} className="hover:bg-slate-800/30">
                            <td className="py-3 px-3 font-semibold text-white">{f.user.fullName}</td>
                            <td className="py-3 px-3 text-dark-muted">{f.user.email}</td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-200">
                              ₦{(f.stats.totalNgnPaid / 100).toLocaleString()}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-200">
                              {(f.stats.totalUsdtPaid / 1000000).toLocaleString()} USDT
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                  f.isFlagged
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}
                              >
                                {f.isFlagged ? 'REVIEW REQUIRED' : 'NORMAL VOLUME'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-xs text-dark-muted py-4 text-center">No host accounts currently flagged.</p>
              )}
            </section>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 2: LIVE SUPPORT CHAT DESK
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'support' && (
          <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-2xl animate-in fade-in duration-150">
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
              {/* Left Column: Sessions List (4 cols) */}
              <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-dark-border flex flex-col bg-slate-900/40">
                {/* Search & Filter Header */}
                <div className="p-3.5 border-b border-dark-border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-brand-400" />
                      <span>Chat Sessions Queue</span>
                    </h2>
                    <button
                      onClick={() => refetchSupportSessions()}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Refresh queue"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'active', label: 'Active' },
                      { id: 'needs_agent', label: 'Needs Agent' },
                      { id: 'closed', label: 'Closed' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          setSupportStatusFilter(f.id);
                          setSupportPage(1);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                          supportStatusFilter === f.id
                            ? 'bg-brand-500 text-slate-950'
                            : 'bg-dark-bg text-slate-400 hover:text-white border border-dark-border'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-dark-muted absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search name, email, session..."
                      value={supportSearch}
                      onChange={(e) => {
                        setSupportSearch(e.target.value);
                        setSupportPage(1);
                      }}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-dark-muted focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Sessions Scroll List */}
                <div className="flex-1 overflow-y-auto divide-y divide-dark-border/50 max-h-[480px]">
                  {supportSessionsData?.sessions?.length > 0 ? (
                    supportSessionsData.sessions.map((sess) => {
                      const isSelected = sess.sessionId === selectedSessionId;
                      return (
                        <button
                          key={sess._id}
                          onClick={() => setSelectedSessionId(sess.sessionId)}
                          className={`w-full text-left p-3.5 transition-all flex flex-col gap-1.5 ${
                            isSelected
                              ? 'bg-brand-500/10 border-l-4 border-l-brand-500 text-white'
                              : 'hover:bg-slate-800/40 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-extrabold text-xs truncate text-white">
                                {sess.name || 'Guest User'}
                              </span>
                              {sess.isAgentRequested && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  Agent
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                sess.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-slate-800 text-slate-400 border border-dark-border'
                              }`}
                            >
                              {sess.status}
                            </span>
                          </div>

                          <p className="text-[11px] text-dark-muted font-mono truncate">{sess.email}</p>

                          {sess.lastMessageText && (
                            <p className="text-xs text-slate-300 line-clamp-1 italic">
                              "{sess.lastMessageText}"
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-dark-muted mt-1">
                            <span>
                              {sess.lastMessageAt
                                ? new Date(sess.lastMessageAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                            {sess.unreadAdminCount > 0 && (
                              <span className="px-1.5 py-0.2 bg-brand-500 text-slate-950 font-black rounded-full text-[9px]">
                                {sess.unreadAdminCount} new
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-xs text-dark-muted">
                      No support chat sessions found.
                    </div>
                  )}
                </div>

                {/* Sessions Pagination */}
                {supportSessionsData?.pagination?.totalPages > 1 && (
                  <div className="p-2.5 border-t border-dark-border flex items-center justify-between text-xs text-dark-muted">
                    <span>
                      Page {supportPage} of {supportSessionsData.pagination.totalPages}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSupportPage((p) => Math.max(1, p - 1))}
                        disabled={supportPage === 1}
                        className="p-1 rounded bg-dark-bg border border-dark-border disabled:opacity-40"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setSupportPage((p) =>
                            Math.min(supportSessionsData.pagination.totalPages, p + 1)
                          )
                        }
                        disabled={supportPage === supportSessionsData.pagination.totalPages}
                        className="p-1 rounded bg-dark-bg border border-dark-border disabled:opacity-40"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Live Transcript & Admin Reply Composer (8 cols) */}
              <div className="lg:col-span-8 flex flex-col min-h-[500px]">
                {selectedSessionData?.session ? (
                  <>
                    {/* Active Conversation Header */}
                    <div className="p-4 border-b border-dark-border bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-sm text-white">
                            {selectedSessionData.session.name}
                          </h3>
                          <span className="text-xs text-dark-muted">
                            ({selectedSessionData.session.email})
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                              selectedSessionData.session.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 border-dark-border'
                            }`}
                          >
                            {selectedSessionData.session.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-dark-muted font-mono mt-0.5">
                          Session ID: {selectedSessionData.session.sessionId}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedSessionData.session.status === 'active' && (
                          <button
                            onClick={handleCloseSupportSession}
                            disabled={isClosingSession}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Close &amp; Purge Files</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Chat Messages Thread */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs max-h-[480px]">
                      {selectedSessionData.messages?.map((msg) => {
                        const isUser = msg.sender === 'user';
                        const isAdmin = msg.sender === 'admin';
                        const isBot = msg.sender === 'bot';

                        return (
                          <div
                            key={msg._id}
                            className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-[10px] font-extrabold text-dark-muted">
                                {isAdmin
                                  ? `You (Admin: ${msg.senderName})`
                                  : isUser
                                  ? msg.senderName || 'User'
                                  : 'Sprinkl Bot'}
                              </span>
                              <span className="text-[9px] text-dark-muted font-mono">
                                {msg.createdAt
                                  ? new Date(msg.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : ''}
                              </span>
                            </div>

                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed break-words shadow-md ${
                                isAdmin
                                  ? 'bg-emerald-500 text-slate-950 font-bold rounded-tr-none'
                                  : isUser
                                  ? 'bg-slate-800 border border-dark-border text-white rounded-tl-none'
                                  : 'bg-slate-900 border border-dark-border/80 text-slate-300 rounded-tl-none'
                              }`}
                            >
                              <p className="whitespace-pre-wrap text-[13px]">{msg.text}</p>

                              {/* Attachments preview */}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2.5 pt-2 border-t border-black/10 dark:border-white/10 space-y-1.5">
                                  {msg.attachments.map((att, i) => {
                                    const isImage = att.contentType?.startsWith('image/');
                                    const downloadUrl = att.fileId
                                      ? `${api.defaults.baseURL || '/api'}/support/attachment/${att.fileId}`
                                      : null;

                                    return (
                                      <div key={i} className="rounded-lg overflow-hidden">
                                        {isImage && downloadUrl ? (
                                          <a
                                            href={downloadUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block"
                                          >
                                            <img
                                              src={downloadUrl}
                                              alt={att.filename}
                                              className="max-h-36 rounded-lg object-cover border border-white/20"
                                            />
                                          </a>
                                        ) : (
                                          <a
                                            href={downloadUrl || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 rounded bg-black/20 text-[11px] font-mono"
                                          >
                                            <FileText className="w-4 h-4" />
                                            <span className="truncate">{att.filename}</span>
                                          </a>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Admin Reply Composer */}
                    <div className="p-3.5 border-t border-dark-border bg-slate-900/90 shrink-0">
                      <form onSubmit={handleSendAdminReply} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Type your official response to the user..."
                          value={adminReplyText}
                          onChange={(e) => setAdminReplyText(e.target.value)}
                          className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-dark-muted focus:outline-none focus:border-brand-500"
                        />
                        <button
                          type="submit"
                          disabled={!adminReplyText.trim() || isSendingReply}
                          className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
                        >
                          <Send className="w-4 h-4 stroke-[2.5]" />
                          <span>{isSendingReply ? 'Sending…' : 'Send Reply'}</span>
                        </button>
                      </form>
                      <p className="text-[10px] text-dark-muted mt-1.5">
                        💡 Sending a response appears instantly in the user's widget and dispatches an email notification.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-dark-muted space-y-2">
                    <MessageSquare className="w-10 h-10 opacity-40" />
                    <p className="text-sm font-bold text-slate-300">Select a support conversation</p>
                    <p className="text-xs max-w-sm">
                      Choose any session on the left queue to view the full dialogue, attachments, and reply directly as a live agent.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 3: GIVEAWAYS MONITOR (Paginated)
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'giveaways' && (
          <section className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-6 space-y-5 animate-in fade-in duration-150">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Platform Giveaways Monitor</h2>
                <p className="text-xs text-dark-muted">
                  Inspect all dual-currency campaigns created across the platform
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Search title / slug..."
                  value={giveawaySearch}
                  onChange={(e) => {
                    setGiveawaySearch(e.target.value);
                    setGiveawayPage(1);
                  }}
                  className="bg-dark-bg border border-dark-border rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-dark-muted focus:outline-none focus:border-brand-500"
                />

                <select
                  value={giveawayStatusFilter}
                  onChange={(e) => {
                    setGiveawayStatusFilter(e.target.value);
                    setGiveawayPage(1);
                  }}
                  className="bg-dark-bg border border-dark-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={giveawayCurrencyFilter}
                  onChange={(e) => {
                    setGiveawayCurrencyFilter(e.target.value);
                    setGiveawayPage(1);
                  }}
                  className="bg-dark-bg border border-dark-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="all">All Currencies</option>
                  <option value="NGN">NGN (Naira)</option>
                  <option value="USDT">USDT (Crypto)</option>
                </select>
              </div>
            </div>

            {giveawaysLoading ? (
              <div className="space-y-4">
                <div className="sm:hidden">
                  <MobileCardSkeleton count={4} />
                </div>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-dark-muted">
                        <th className="py-3 px-3">Title &amp; Slug</th>
                        <th className="py-3 px-3">Host</th>
                        <th className="py-3 px-3">Currency</th>
                        <th className="py-3 px-3">Prize / Winner</th>
                        <th className="py-3 px-3">Slots Claimed</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Created</th>
                      </tr>
                    </thead>
                    <TableSkeleton rows={6} cols={7} colWidths={['w-44', 'w-36', 'w-16', 'w-24', 'w-20', 'w-20', 'w-20']} />
                  </table>
                </div>
              </div>
            ) : giveawaysData?.giveaways?.length > 0 ? (
              <div className="space-y-4">
                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3">
                  {giveawaysData.giveaways.map((g) => (
                    <div key={g._id} className="bg-dark-bg rounded-xl border border-dark-border p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white line-clamp-1">{g.title}</span>
                        <StatusBadge status={g.status} />
                      </div>
                      <p className="text-xs text-dark-muted">
                        Host: <strong className="text-slate-200">{g.host?.fullName || 'Anonymous'}</strong> ({g.host?.email})
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span>
                          Prize: <strong>{formatCurrency(g.amountPerRecipient, g.currency)}</strong> / person
                        </span>
                        <span>
                          Slots: <strong className="text-brand-400">{g.slotsClaimed} / {g.totalSlots}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-dark-muted">
                        <th className="py-3 px-3">Title &amp; Slug</th>
                        <th className="py-3 px-3">Host</th>
                        <th className="py-3 px-3">Currency</th>
                        <th className="py-3 px-3">Prize / Winner</th>
                        <th className="py-3 px-3">Slots Claimed</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border text-xs">
                      {giveawaysData.giveaways.map((g) => (
                        <tr key={g._id} className="hover:bg-slate-800/30">
                          <td className="py-3.5 px-3">
                            <p className="font-bold text-white line-clamp-1">{g.title}</p>
                            <p className="text-[10px] font-mono text-dark-muted">/g/{g.slug}</p>
                          </td>
                          <td className="py-3.5 px-3">
                            <p className="font-semibold text-slate-200">{g.host?.fullName || 'N/A'}</p>
                            <p className="text-[10px] text-dark-muted">{g.host?.email}</p>
                          </td>
                          <td className="py-3.5 px-3 font-bold">{g.currency}</td>
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-200">
                            {formatCurrency(g.amountPerRecipient, g.currency)}
                          </td>
                          <td className="py-3.5 px-3 font-mono">
                            <span className="text-brand-400 font-bold">{g.slotsClaimed}</span>
                            <span className="text-dark-muted"> / {g.totalSlots}</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <StatusBadge status={g.status} />
                          </td>
                          <td className="py-3.5 px-3 text-right text-dark-muted whitespace-nowrap">
                            {new Date(g.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {giveawaysData.pagination?.totalPages > 1 && (
                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-dark-muted border-t border-dark-border/70">
                    <p>
                      Showing{' '}
                      <span className="font-semibold text-slate-200">
                        {(giveawayPage - 1) * giveawaysData.pagination.limit + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-semibold text-slate-200">
                        {Math.min(
                          giveawayPage * giveawaysData.pagination.limit,
                          giveawaysData.pagination.total
                        )}
                      </span>{' '}
                      of <span className="font-semibold text-slate-200">{giveawaysData.pagination.total}</span> giveaways
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setGiveawayPage((p) => Math.max(1, p - 1))}
                        disabled={giveawayPage === 1}
                        className="p-1.5 rounded-lg border border-dark-border bg-dark-bg hover:bg-slate-800 disabled:opacity-40"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {Array.from({ length: giveawaysData.pagination.totalPages }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          onClick={() => setGiveawayPage(n)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold ${
                            giveawayPage === n
                              ? 'bg-brand-500 text-slate-950'
                              : 'bg-dark-bg border border-dark-border text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {n}
                        </button>
                      ))}

                      <button
                        onClick={() =>
                          setGiveawayPage((p) => Math.min(giveawaysData.pagination.totalPages, p + 1))
                        }
                        disabled={giveawayPage === giveawaysData.pagination.totalPages}
                        className="p-1.5 rounded-lg border border-dark-border bg-dark-bg hover:bg-slate-800 disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-dark-muted py-8 text-center">No giveaways matching the filter criteria.</p>
            )}
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 4: EXTERNAL PROVIDER TRANSACTIONS (Paginated)
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'transactions' && (
          <section className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-6 space-y-5 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">External Provider Audit Log</h2>
                <p className="text-xs text-dark-muted">
                  Webhook confirmations from Flutterwave, Paystack, TRON, and BSC networks
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Search reference..."
                  value={txSearch}
                  onChange={(e) => {
                    setTxSearch(e.target.value);
                    setTxPage(1);
                  }}
                  className="bg-dark-bg border border-dark-border rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-dark-muted focus:outline-none focus:border-brand-500"
                />

                <select
                  value={txProviderFilter}
                  onChange={(e) => {
                    setTxProviderFilter(e.target.value);
                    setTxPage(1);
                  }}
                  className="bg-dark-bg border border-dark-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="all">All Providers</option>
                  <option value="flutterwave">Flutterwave</option>
                  <option value="paystack">Paystack</option>
                  <option value="tron">TRON</option>
                  <option value="bsc">BSC</option>
                </select>
              </div>
            </div>

            {txLoading ? (
              <div className="space-y-4">
                <div className="sm:hidden">
                  <MobileCardSkeleton count={4} />
                </div>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-dark-muted">
                        <th className="py-3 px-3">Provider</th>
                        <th className="py-3 px-3">Reference</th>
                        <th className="py-3 px-3">Direction</th>
                        <th className="py-3 px-3">Amount</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <TableSkeleton rows={6} cols={6} colWidths={['w-24', 'w-40', 'w-20', 'w-28', 'w-20', 'w-24']} />
                  </table>
                </div>
              </div>
            ) : txData?.transactions?.length > 0 ? (
              <div className="space-y-4">
                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3">
                  {txData.transactions.map((t) => (
                    <div key={t._id} className="bg-dark-bg rounded-xl border border-dark-border p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-brand-400 uppercase">{t.provider}</span>
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          {t.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold capitalize ${
                            t.direction === 'inbound' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {t.direction}
                        </span>
                        <span className="text-xs font-mono font-bold text-white">
                          {formatCurrency(t.amount, t.currency)}
                        </span>
                      </div>
                      <p className="text-[11px] text-dark-muted font-mono truncate">{t.providerReference}</p>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-dark-muted">
                        <th className="py-3 px-3">Provider</th>
                        <th className="py-3 px-3">Reference</th>
                        <th className="py-3 px-3">Direction</th>
                        <th className="py-3 px-3">Amount</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border text-xs">
                      {txData.transactions.map((t) => (
                        <tr key={t._id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-3 uppercase font-bold text-brand-400">{t.provider}</td>
                          <td className="py-3 px-3 font-mono text-xs text-slate-300">{t.providerReference}</td>
                          <td className="py-3 px-3 capitalize font-semibold">
                            <span className={t.direction === 'inbound' ? 'text-emerald-400' : 'text-rose-400'}>
                              {t.direction}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold">
                            {formatCurrency(t.amount, t.currency)}
                          </td>
                          <td className="py-3 px-3">
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                              {t.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-dark-muted font-mono whitespace-nowrap">
                            {new Date(t.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {txData.pagination?.totalPages > 1 && (
                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-dark-muted border-t border-dark-border/70">
                    <p>
                      Showing {(txPage - 1) * txData.pagination.limit + 1} to{' '}
                      {Math.min(txPage * txData.pagination.limit, txData.pagination.total)} of{' '}
                      {txData.pagination.total} provider transactions
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                        disabled={txPage === 1}
                        className="p-1.5 rounded-lg border border-dark-border bg-dark-bg hover:bg-slate-800 disabled:opacity-40"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {Array.from({ length: txData.pagination.totalPages }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          onClick={() => setTxPage(n)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold ${
                            txPage === n
                              ? 'bg-brand-500 text-slate-950'
                              : 'bg-dark-bg border border-dark-border text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {n}
                        </button>
                      ))}

                      <button
                        onClick={() => setTxPage((p) => Math.min(txData.pagination.totalPages, p + 1))}
                        disabled={txPage === txData.pagination.totalPages}
                        className="p-1.5 rounded-lg border border-dark-border bg-dark-bg hover:bg-slate-800 disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-dark-muted py-8 text-center">No provider transactions logged yet.</p>
            )}
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 5: CLAIMS & WINNERS LEDGER (Paginated)
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'claims' && (
          <section className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-6 space-y-5 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Claims &amp; Winners Audit</h2>
                <p className="text-xs text-dark-muted">
                  Recipient destination accounts, claim amounts, and idempotent transfer results
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Search account / wallet..."
                  value={claimSearch}
                  onChange={(e) => {
                    setClaimSearch(e.target.value);
                    setClaimPage(1);
                  }}
                  className="bg-dark-bg border border-dark-border rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-dark-muted focus:outline-none focus:border-brand-500"
                />

                <select
                  value={claimStatusFilter}
                  onChange={(e) => {
                    setClaimStatusFilter(e.target.value);
                    setClaimPage(1);
                  }}
                  className="bg-dark-bg border border-dark-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid (Disbursed)</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            {claimsLoading ? (
              <div className="space-y-4">
                <div className="sm:hidden">
                  <MobileCardSkeleton count={4} />
                </div>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-dark-muted">
                        <th className="py-3 px-3">Giveaway Title</th>
                        <th className="py-3 px-3">Beneficiary Destination</th>
                        <th className="py-3 px-3">Amount</th>
                        <th className="py-3 px-3">Currency</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Payout Ref</th>
                        <th className="py-3 px-3 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <TableSkeleton rows={6} cols={7} colWidths={['w-36', 'w-44', 'w-24', 'w-16', 'w-20', 'w-28', 'w-24']} />
                  </table>
                </div>
              </div>
            ) : claimsData?.claims?.length > 0 ? (
              <div className="space-y-4">
                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3">
                  {claimsData.claims.map((c) => (
                    <div key={c._id} className="bg-dark-bg rounded-xl border border-dark-border p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white truncate max-w-[200px]">
                          {c.giveaway?.title || 'Giveaway'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {c.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-dark-muted truncate">
                        {c.destination?.details?.accountName || c.destination?.details?.address || c.destination?.normalized}
                      </p>
                      <div className="flex items-center justify-between text-xs font-mono font-bold">
                        <span className="text-brand-400">{formatCurrency(c.amount, c.currency)}</span>
                        <span className="text-dark-muted">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-dark-muted">
                        <th className="py-3 px-3">Giveaway Title</th>
                        <th className="py-3 px-3">Beneficiary Destination</th>
                        <th className="py-3 px-3">Amount</th>
                        <th className="py-3 px-3">Currency</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Claimed At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border text-xs">
                      {claimsData.claims.map((c) => (
                        <tr key={c._id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-3 font-semibold text-white max-w-[220px] truncate">
                            {c.giveaway?.title || 'Giveaway'}
                          </td>
                          <td className="py-3 px-3 font-mono text-xs">
                            <p className="font-bold text-slate-200">
                              {c.destination?.details?.accountName || c.destination?.details?.bankName || 'Direct Destination'}
                            </p>
                            <p className="text-[10px] text-dark-muted truncate max-w-[280px]">
                              {c.destination?.details?.accountNumber || c.destination?.details?.address || c.destination?.normalized}
                            </p>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                            {formatCurrency(c.amount, c.currency)}
                          </td>
                          <td className="py-3 px-3 font-bold">{c.currency}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                c.status === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {c.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-dark-muted font-mono whitespace-nowrap">
                            {new Date(c.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {claimsData.pagination?.totalPages > 1 && (
                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-dark-muted border-t border-dark-border/70">
                    <p>
                      Showing {(claimPage - 1) * claimsData.pagination.limit + 1} to{' '}
                      {Math.min(claimPage * claimsData.pagination.limit, claimsData.pagination.total)} of{' '}
                      {claimsData.pagination.total} claims
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setClaimPage((p) => Math.max(1, p - 1))}
                        disabled={claimPage === 1}
                        className="p-1.5 rounded-lg border border-dark-border bg-dark-bg hover:bg-slate-800 disabled:opacity-40"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {Array.from({ length: claimsData.pagination.totalPages }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          onClick={() => setClaimPage(n)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold ${
                            claimPage === n
                              ? 'bg-brand-500 text-slate-950'
                              : 'bg-dark-bg border border-dark-border text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {n}
                        </button>
                      ))}

                      <button
                        onClick={() => setClaimPage((p) => Math.min(claimsData.pagination.totalPages, p + 1))}
                        disabled={claimPage === claimsData.pagination.totalPages}
                        className="p-1.5 rounded-lg border border-dark-border bg-dark-bg hover:bg-slate-800 disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-dark-muted py-8 text-center">No claims found.</p>
            )}
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 6: USERS & KYC DIRECTORY (Paginated)
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <section className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-6 space-y-5 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Users &amp; Roles Management</h2>
                <p className="text-xs text-dark-muted">
                  Directory of registered hosts and platform administrators
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  className="bg-dark-bg border border-dark-border rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-dark-muted focus:outline-none focus:border-brand-500"
                />

                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value);
                    setUserPage(1);
                  }}
                  className="bg-dark-bg border border-dark-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="host">Hosts</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>
            </div>

            {usersLoading ? (
              <div className="space-y-4">
                <div className="sm:hidden">
                  <MobileCardSkeleton count={4} />
                </div>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-dark-muted">
                        <th className="py-3 px-3">User</th>
                        <th className="py-3 px-3">Role</th>
                        <th className="py-3 px-3">Email Verified</th>
                        <th className="py-3 px-3">Payment Limit</th>
                        <th className="py-3 px-3">NGN Balance</th>
                        <th className="py-3 px-3">USDT Balance</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <TableSkeleton rows={6} cols={7} colWidths={['w-36', 'w-20', 'w-20', 'w-24', 'w-24', 'w-24', 'w-28']} />
                  </table>
                </div>
              </div>
            ) : usersData?.users?.length > 0 ? (
              <div className="space-y-4">
                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3">
                  {usersData.users.map((u) => (
                    <div key={u._id} className="bg-dark-bg rounded-xl border border-dark-border p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{u.fullName}</span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            u.role === 'admin'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-brand-500/10 text-brand-400 border-brand-500/20'
                          }`}
                        >
                          {u.role}
                        </span>
                      </div>
                      <p className="text-xs text-dark-muted">{u.email}</p>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span>NGN: {formatCurrency(u.balances?.NGN?.available || 0, 'NGN')}</span>
                        <span>USDT: {formatCurrency(u.balances?.USDT?.available || 0, 'USDT')}</span>
                      </div>
                      <div className="pt-2 border-t border-dark-border/60 flex items-center justify-end">
                        <button
                          onClick={() => handleToggleUserRole(u)}
                          className="text-xs font-bold text-brand-400 hover:underline"
                        >
                          Change Role →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-dark-muted">
                        <th className="py-3 px-3">User</th>
                        <th className="py-3 px-3">Role</th>
                        <th className="py-3 px-3">Email Verified</th>
                        <th className="py-3 px-3">Payment Limit</th>
                        <th className="py-3 px-3">NGN Balance</th>
                        <th className="py-3 px-3">USDT Balance</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border text-xs">
                      {usersData.users.map((u) => (
                        <tr key={u._id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-3">
                            <p className="font-bold text-white">{u.fullName}</p>
                            <p className="text-[10px] text-dark-muted">{u.email}</p>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                u.role === 'admin'
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : 'bg-brand-500/10 text-brand-400 border-brand-500/20'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-bold ${
                                u.emailVerified ? 'text-emerald-400' : 'text-amber-400'
                              }`}
                            >
                              {u.emailVerified ? 'VERIFIED' : 'PENDING'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {editingThresholdUserId === u._id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  placeholder="₦ in Naira"
                                  value={editingThresholdValue}
                                  onChange={(e) => setEditingThresholdValue(e.target.value)}
                                  className="w-24 bg-dark-bg border border-brand-500 rounded px-1.5 py-0.5 text-xs text-white font-mono"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleUpdateThresholdDirectly(u._id)}
                                  className="text-[10px] bg-brand-500 text-slate-950 font-bold px-1.5 py-0.5 rounded"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingThresholdUserId(null)}
                                  className="text-[10px] text-slate-400 hover:text-white px-1"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingThresholdUserId(u._id);
                                  setEditingThresholdValue(String(((u.kyc?.payoutReviewThreshold || 50000000) / 100)));
                                }}
                                title="Click to edit payment threshold"
                                className="font-mono font-bold text-amber-400 hover:underline flex items-center gap-1"
                              >
                                <span>₦{((u.kyc?.payoutReviewThreshold || 50000000) / 100).toLocaleString()}</span>
                                <span className="text-[10px] text-dark-muted">✎</span>
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-200">
                            {formatCurrency(u.balances?.NGN?.available || 0, 'NGN')}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-200">
                            {formatCurrency(u.balances?.USDT?.available || 0, 'USDT')}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleToggleUserRole(u)}
                              className="px-2.5 py-1 rounded-lg border border-dark-border hover:bg-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition-all"
                            >
                              {u.role === 'admin' ? 'Demote to Host' : 'Promote to Admin'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {usersData.pagination?.totalPages > 1 && (
                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-dark-muted border-t border-dark-border/70">
                    <p>
                      Showing {(userPage - 1) * usersData.pagination.limit + 1} to{' '}
                      {Math.min(userPage * usersData.pagination.limit, usersData.pagination.total)} of{' '}
                      {usersData.pagination.total} users
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                        disabled={userPage === 1}
                        className="p-1.5 rounded-lg border border-dark-border bg-dark-bg hover:bg-slate-800 disabled:opacity-40"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {Array.from({ length: usersData.pagination.totalPages }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          onClick={() => setUserPage(n)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold ${
                            userPage === n
                              ? 'bg-brand-500 text-slate-950'
                              : 'bg-dark-bg border border-dark-border text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {n}
                        </button>
                      ))}

                      <button
                        onClick={() => setUserPage((p) => Math.min(usersData.pagination.totalPages, p + 1))}
                        disabled={userPage === usersData.pagination.totalPages}
                        className="p-1.5 rounded-lg border border-dark-border bg-dark-bg hover:bg-slate-800 disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-dark-muted py-8 text-center">No users matching search.</p>
            )}
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 7: PAYMENT THRESHOLD REQUESTS (Paginated)
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'kyc' && (
          <section className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-6 space-y-5 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Payment Threshold Upgrade Requests</h2>
                <p className="text-xs text-dark-muted">
                  Review and approve host requests to raise single-giveaway payout limits above ₦500,000
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={kycStatusFilter}
                  onChange={(e) => {
                    setKycStatusFilter(e.target.value);
                    setKycPage(1);
                  }}
                  className="bg-dark-bg border border-dark-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="pending">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="all">All Requests</option>
                </select>
                <button
                  onClick={() => refetchKycRequests()}
                  className="p-1.5 rounded-lg border border-dark-border hover:bg-slate-800 text-slate-300 hover:text-white"
                  title="Refresh requests"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {kycRequestsLoading ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-dark-muted">
                        <th className="py-3 px-3">User</th>
                        <th className="py-3 px-3">Current Limit</th>
                        <th className="py-3 px-3">Requested Limit</th>
                        <th className="py-3 px-3">Reason</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <TableSkeleton rows={5} cols={7} colWidths={['w-36', 'w-24', 'w-24', 'w-48', 'w-20', 'w-20', 'w-28']} />
                  </table>
                </div>
              </div>
            ) : kycRequestsData?.requests?.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-dark-muted">
                        <th className="py-3 px-3">User</th>
                        <th className="py-3 px-3">Current Limit</th>
                        <th className="py-3 px-3">Requested Limit</th>
                        <th className="py-3 px-3">Reason</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border text-xs">
                      {kycRequestsData.requests.map((r) => {
                        const status = r.kyc?.requestStatus || 'none';
                        const currentNaira = ((r.kyc?.payoutReviewThreshold || 50000000) / 100).toLocaleString();
                        const requestedNaira = ((r.kyc?.requestedThreshold || 0) / 100).toLocaleString();

                        return (
                          <tr key={r._id} className="hover:bg-slate-800/30">
                            <td className="py-3 px-3">
                              <p className="font-bold text-white">{r.fullName}</p>
                              <p className="text-[10px] text-dark-muted">{r.email}</p>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-300">
                              ₦{currentNaira}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-amber-400">
                              ₦{requestedNaira}
                            </td>
                            <td className="py-3 px-3 max-w-xs">
                              <p className="text-xs text-slate-300 truncate" title={r.kyc?.requestReason}>
                                {r.kyc?.requestReason || '—'}
                              </p>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                  status === 'approved'
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                    : status === 'rejected'
                                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                }`}
                              >
                                {status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-[11px] text-dark-muted whitespace-nowrap">
                              {r.kyc?.requestedAt
                                ? new Date(r.kyc.requestedAt).toLocaleDateString()
                                : '—'}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {status === 'pending' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleKycReview(r._id, 'approve', r.kyc.requestedThreshold)}
                                    className="px-2.5 py-1 rounded-lg bg-brand-500 hover:bg-brand-600 text-slate-950 text-[11px] font-bold transition-all"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleKycReview(r._id, 'reject')}
                                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold transition-all"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-dark-muted uppercase font-bold">
                                  {r.kyc?.reviewedAt
                                    ? `Reviewed ${new Date(r.kyc.reviewedAt).toLocaleDateString()}`
                                    : 'Reviewed'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {kycRequestsData.pagination?.totalPages > 1 && (
                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-dark-muted border-t border-dark-border/70">
                    <p>
                      Showing {(kycPage - 1) * kycRequestsData.pagination.limit + 1} to{' '}
                      {Math.min(kycPage * kycRequestsData.pagination.limit, kycRequestsData.pagination.total)} of{' '}
                      {kycRequestsData.pagination.total} requests
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setKycPage((p) => Math.max(1, p - 1))}
                        disabled={kycPage === 1}
                        className="p-1.5 rounded-lg border border-dark-border bg-dark-bg hover:bg-slate-800 disabled:opacity-40"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {Array.from({ length: kycRequestsData.pagination.totalPages }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          onClick={() => setKycPage(n)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold ${
                            kycPage === n
                              ? 'bg-brand-500 text-slate-950'
                              : 'bg-dark-bg border border-dark-border text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {n}
                        </button>
                      ))}

                      <button
                        onClick={() => setKycPage((p) => Math.min(kycRequestsData.pagination.totalPages, p + 1))}
                        disabled={kycPage === kycRequestsData.pagination.totalPages}
                        className="p-1.5 rounded-lg border border-dark-border bg-dark-bg hover:bg-slate-800 disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-dark-muted py-8 text-center">
                No payment threshold requests in this category.
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
