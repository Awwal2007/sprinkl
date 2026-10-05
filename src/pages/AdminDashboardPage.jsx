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
  UserPlus,
  Plus,
} from 'lucide-react';
import api from '../api/client';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import TableSkeleton, { MobileCardSkeleton } from '../components/TableSkeleton';
import { toast, confirmDialog } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import socket, { joinAdminRoom } from '../lib/socket';
import SEO from '../components/SEO';

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
  // 6. USERS & ACTIVE USERS DIRECTORY STATE & QUERY
  // ──────────────────────────────────────────────
  const [userPage, setUserPage] = useState(1);
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userActivityFilter, setUserActivityFilter] = useState('all'); // 'all' | 'online' | 'today' | 'week'
  const [userSearch, setUserSearch] = useState('');

  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['adminUsers', userPage, userRoleFilter, userActivityFilter, userSearch],
    queryFn: async () => {
      const res = await api.get('/admin/users', {
        params: {
          page: userPage,
          limit: 12,
          role: userRoleFilter,
          activity: userActivityFilter,
          search: userSearch,
        },
      });
      return res.data;
    },
    enabled: activeTab === 'users' || activeTab === 'overview',
  });

  // Dedicated Admin Staff Query & Actions
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('admin');
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const { data: adminsData, isLoading: adminsLoading, refetch: refetchAdmins } = useQuery({
    queryKey: ['adminStaffList'],
    queryFn: async () => {
      const res = await api.get('/admin/admins');
      return res.data;
    },
    enabled: activeTab === 'admins' || activeTab === 'overview',
  });

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword) {
      toast.error('Please fill in all administrator fields');
      return;
    }
    if (newAdminPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setCreatingAdmin(true);
    try {
      await api.post('/admin/admins', {
        fullName: newAdminName.trim(),
        email: newAdminEmail.trim(),
        password: newAdminPassword,
        role: newAdminRole,
      });
      toast.success(`Administrator ${newAdminName} created successfully!`, 'Admin Created');
      setAdminModalOpen(false);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminRole('admin');
      refetchAdmins();
      refetchReports();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create admin', 'Error');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleToggleAdminStatus = async (targetAdmin) => {
    const nextStatus = !targetAdmin.isActive;
    const confirmed = await confirmDialog({
      title: `${nextStatus ? 'Activate' : 'Deactivate'} ${targetAdmin.fullName}?`,
      message: `Are you sure you want to ${nextStatus ? 'activate' : 'deactivate'} this administrator account?`,
      confirmText: `Yes, ${nextStatus ? 'Activate' : 'Deactivate'}`,
      confirmVariant: nextStatus ? 'brand' : 'danger',
    });
    if (!confirmed) return;

    try {
      await api.patch(`/admin/admins/${targetAdmin._id}`, { isActive: nextStatus });
      toast.success(`Admin ${targetAdmin.fullName} status updated`, 'Status Changed');
      refetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update admin', 'Error');
    }
  };

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


  const formatCurrency = (amount, currency, provider) => {
    let curr = (currency || '').toUpperCase();
    if (!curr) {
      if (provider && ['tron', 'bsc'].includes(provider.toLowerCase())) {
        curr = 'USDT';
      } else {
        curr = 'NGN';
      }
    }

    if (curr === 'NGN') {
      return `₦${((amount || 0) / 100).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    if (curr === 'AIRTIME') {
      return `₦${((amount || 0) / 100).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })} (Airtime)`;
    }
    if (curr === 'USDT') {
      return `$${((amount || 0) / 1000000).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} USDT`;
    }
    return `₦${((amount || 0) / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getTxStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'success' || s === 'paid') {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
    if (s === 'pending') {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-slate-100 transition-colors duration-150">
      <SEO
        title="Admin Command Center — Sprinkl"
        description="Sprinkl Platform Management & Operations Command Center"
        canonical="/admin"
        noIndex={true}
      />
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 w-full space-y-4 sm:space-y-6">
        {/* Top Header & Admin Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-gray-200 dark:border-dark-border/70">
          <div className="flex items-start justify-between gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-brand-500/20 shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h1 className="text-base sm:text-2xl font-black text-gray-950 dark:text-white tracking-tight truncate sm:whitespace-normal">
                    Sprinkl Command Center
                  </h1>
                  <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                    Platform Admin
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-600 dark:text-dark-muted mt-0.5 leading-relaxed hidden sm:block">
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
              className="sm:hidden p-2.5 bg-white dark:bg-dark-card hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-dark-border rounded-xl text-gray-700 dark:text-slate-300 hover:text-gray-950 dark:hover:text-white transition-all shadow-sm shrink-0 active:scale-95"
              title="Refresh feeds"
              aria-label="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile subtext */}
          <p className="text-[11px] text-gray-600 dark:text-dark-muted leading-relaxed sm:hidden -mt-1">
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
              className="px-3.5 py-2 bg-white dark:bg-dark-card hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-dark-border rounded-xl text-xs font-bold text-gray-700 dark:text-slate-300 hover:text-gray-950 dark:hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Feeds</span>
            </button>
          </div>
        </div>

        {/* ─── Navigation Tabs Bar (Horizontal scroll on mobile) ─── */}
        <div className="flex overflow-x-auto no-scrollbar gap-1.5 p-1.5 bg-white/80 dark:bg-dark-card/60 border border-gray-200/80 dark:border-dark-border/80 rounded-2xl overscroll-x-contain touch-pan-x scroll-smooth shadow-sm">
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
            {
              id: 'users',
              label: 'Users Directory',
              icon: Users,
              badge: reportData?.users?.activeNow > 0 ? `${reportData?.users?.activeNow} active` : undefined,
            },
            {
              id: 'admins',
              label: 'Admins & Staff',
              icon: ShieldCheck,
              badge: adminsData?.total || reportData?.users?.admins || 0,
            },
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
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-slate-950 text-white' : 'bg-brand-500/20 text-brand-600 dark:text-brand-400'
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
            {/* Platform Revenue, Disbursed Volume & Active Users KPIs */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
              {/* Active Users Live Pulse Card */}
              <div
                onClick={() => {
                  setActiveTab('users');
                  setUserActivityFilter('online');
                  setUserRoleFilter('all');
                }}
                className="bg-white dark:bg-dark-card border border-emerald-500/30 hover:border-emerald-500/60 dark:border-emerald-500/30 dark:hover:border-emerald-500/60 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-xl relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.99]"
                title="Click to view live active users"
              >
                <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Active Now (Live)
                  </p>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Real-time
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white">
                    {reportData?.users?.activeNow ?? usersData?.stats?.onlineCount ?? 0}
                  </p>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    online now
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-slate-300 mt-2 font-medium">
                  Today: <strong className="text-gray-950 dark:text-white font-bold">{reportData?.users?.activeToday ?? usersData?.stats?.activeTodayCount ?? 0}</strong> &bull; Week: <strong className="text-gray-950 dark:text-white font-bold">{reportData?.users?.activeThisWeek ?? 0}</strong>
                </p>
              </div>

              {/* NGN Revenue */}
              <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 blur-2xl pointer-events-none" />
                <p className="text-[11px] uppercase tracking-wider text-gray-700 dark:text-slate-300 font-bold mb-1">
                  NGN Platform Fee Profit
                </p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(reportData?.revenue?.NGN || 0, 'NGN')}
                </p>
                <p className="text-[11px] text-gray-600 dark:text-slate-300 mt-2 font-medium">
                  Payout volume: <strong className="text-gray-950 dark:text-white font-bold">{formatCurrency(reportData?.payouts?.NGN || 0, 'NGN')}</strong>
                </p>
              </div>

              {/* USDT Revenue */}
              <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/5 blur-2xl pointer-events-none" />
                <p className="text-[11px] uppercase tracking-wider text-gray-700 dark:text-slate-300 font-bold mb-1">
                  USDT Platform Fee Profit
                </p>
                <p className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400">
                  {formatCurrency(reportData?.revenue?.USDT || 0, 'USDT')}
                </p>
                <p className="text-[11px] text-gray-600 dark:text-slate-300 mt-2 font-medium">
                  Payout volume: <strong className="text-gray-950 dark:text-white font-bold">{formatCurrency(reportData?.payouts?.USDT || 0, 'USDT')}</strong>
                </p>
              </div>

              {/* Campaigns & Conversion */}
              <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-28 h-28 bg-brand-500/5 blur-2xl pointer-events-none" />
                <p className="text-[11px] uppercase tracking-wider text-gray-700 dark:text-slate-300 font-bold mb-1">
                  Campaigns &amp; Claims
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white">
                    {reportData?.giveaways?.total || 0}
                  </p>
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                    ({reportData?.giveaways?.active || 0} active)
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-slate-300 mt-2 font-medium">
                  Slots: <strong className="text-gray-950 dark:text-white font-bold">{reportData?.giveaways?.totalSlotsClaimed || 0} / {reportData?.giveaways?.totalSlots || 0}</strong> ({reportData?.giveaways?.claimRate || 0}%)
                </p>
              </div>

              {/* Users & Live Support Desk */}
              <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/5 blur-2xl pointer-events-none" />
                <p className="text-[11px] uppercase tracking-wider text-gray-700 dark:text-slate-300 font-bold mb-1">
                  Registered Users &amp; Staff
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white">
                    {reportData?.users?.total || 0}
                  </p>
                  <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                    ({reportData?.users?.verified || 0} verified)
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-slate-300 mt-2 font-medium">
                  Admins: <strong className="text-purple-600 dark:text-purple-400 font-bold">{adminsData?.total || reportData?.users?.admins || 0} staff</strong> &bull; <strong className="text-brand-600 dark:text-brand-400 font-bold">{reportData?.support?.active || 0} chats</strong>
                </p>
              </div>
            </section>

            {/* Flagged High-Volume Host Accounts */}
            <section className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm dark:shadow-none">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                    Flagged High-Volume Host Accounts (AML Review)
                  </h2>
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
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
                        <tr className="border-b border-gray-200 dark:border-dark-border text-[11px] uppercase tracking-wider text-gray-700 dark:text-slate-300 font-bold bg-gray-50/70 dark:bg-transparent">
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
                      <div key={f.user._id} className="bg-gray-50 dark:bg-dark-bg rounded-xl border border-gray-200 dark:border-dark-border p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-gray-950 dark:text-white">{f.user.fullName || f.user.name || 'Unnamed Host'}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              f.isFlagged
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {f.isFlagged ? 'FLAGGED' : 'NORMAL'}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-gray-600 dark:text-slate-300">{f.user.email}</p>
                        <div className="flex gap-4 text-xs font-mono">
                          <span className="text-gray-600 dark:text-slate-400">NGN: <strong className="text-gray-950 dark:text-white">{formatCurrency(f.stats.totalNgnPaid, 'NGN')}</strong></span>
                          <span className="text-gray-600 dark:text-slate-400">USDT: <strong className="text-gray-950 dark:text-white">{formatCurrency(f.stats.totalUsdtPaid, 'USDT')}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-dark-border text-[11px] uppercase tracking-wider text-gray-700 dark:text-slate-300 font-bold bg-gray-50/70 dark:bg-transparent">
                          <th className="py-2.5 px-3">Host Name</th>
                          <th className="py-2.5 px-3">Email</th>
                          <th className="py-2.5 px-3">NGN Paid Out</th>
                          <th className="py-2.5 px-3">USDT Paid Out</th>
                          <th className="py-2.5 px-3 text-right">Payment Threshold Audit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-dark-border text-xs">
                        {flagData.map((f) => (
                          <tr key={f.user._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                            <td className="py-3 px-3 font-bold text-gray-950 dark:text-white">{f.user.fullName || f.user.name || 'Unnamed Host'}</td>
                            <td className="py-3 px-3 text-gray-600 dark:text-slate-300 font-medium">{f.user.email}</td>
                            <td className="py-3 px-3 font-mono font-bold text-gray-950 dark:text-white">
                              {formatCurrency(f.stats.totalNgnPaid, 'NGN')}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-gray-950 dark:text-white">
                              {formatCurrency(f.stats.totalUsdtPaid, 'USDT')}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                  f.isFlagged
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
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
                <p className="text-xs text-gray-600 dark:text-slate-400 py-4 text-center">No host accounts currently flagged.</p>
              )}
            </section>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 2: LIVE SUPPORT CHAT DESK
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'support' && (
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl animate-in fade-in duration-150">
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
              {/* Left Column: Sessions List (4 cols) */}
              <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-dark-border flex flex-col bg-gray-50/70 dark:bg-slate-900/40">
                {/* Search & Filter Header */}
                <div className="p-3.5 border-b border-gray-200 dark:border-dark-border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      <span>Chat Sessions Queue</span>
                    </h2>
                    <button
                      onClick={() => refetchSupportSessions()}
                      className="p-1 text-gray-500 dark:text-slate-400 hover:text-gray-950 dark:hover:text-white"
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
                            : 'bg-white dark:bg-dark-bg text-gray-600 dark:text-slate-400 hover:text-gray-950 dark:hover:text-white border border-gray-200 dark:border-dark-border'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 dark:text-dark-muted absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search name, email, session..."
                      value={supportSearch}
                      onChange={(e) => {
                        setSupportSearch(e.target.value);
                        setSupportPage(1);
                      }}
                      className="w-full bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-dark-muted focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Sessions Scroll List */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-200 dark:divide-dark-border/50 max-h-[480px]">
                  {supportSessionsData?.sessions?.length > 0 ? (
                    supportSessionsData.sessions.map((sess) => {
                      const isSelected = sess.sessionId === selectedSessionId;
                      return (
                        <button
                          key={sess._id}
                          onClick={() => setSelectedSessionId(sess.sessionId)}
                          className={`w-full text-left p-3.5 transition-all flex flex-col gap-1.5 ${
                            isSelected
                              ? 'bg-brand-500/10 border-l-4 border-l-brand-500 text-gray-950 dark:text-white'
                              : 'hover:bg-gray-100/80 dark:hover:bg-slate-800/40 text-gray-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-extrabold text-xs truncate text-gray-950 dark:text-white">
                                {sess.name || 'Guest User'}
                              </span>
                              {sess.isAgentRequested && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                  Agent
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                sess.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-dark-border'
                              }`}
                            >
                              {sess.status}
                            </span>
                          </div>

                          <p className="text-[11px] text-gray-500 dark:text-dark-muted font-mono truncate">{sess.email}</p>

                          {sess.lastMessageText && (
                            <p className="text-xs text-gray-700 dark:text-slate-300 line-clamp-1 italic">
                              "{sess.lastMessageText}"
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-dark-muted mt-1">
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
                    <div className="p-8 text-center text-xs text-gray-500 dark:text-dark-muted">
                      No support chat sessions found.
                    </div>
                  )}
                </div>

                {/* Sessions Pagination */}
                {supportSessionsData?.pagination?.totalPages > 1 && (
                  <div className="p-2.5 border-t border-gray-200 dark:border-dark-border flex items-center justify-between text-xs text-gray-500 dark:text-dark-muted">
                    <span>
                      Page {supportPage} of {supportSessionsData.pagination.totalPages}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSupportPage((p) => Math.max(1, p - 1))}
                        disabled={supportPage === 1}
                        className="p-1 rounded bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-slate-300 disabled:opacity-40"
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
                        className="p-1 rounded bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-slate-300 disabled:opacity-40"
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
                    <div className="p-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-sm text-gray-950 dark:text-white">
                            {selectedSessionData.session.name}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-dark-muted">
                            ({selectedSessionData.session.email})
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                              selectedSessionData.session.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-dark-border'
                            }`}
                          >
                            {selectedSessionData.session.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-dark-muted font-mono mt-0.5">
                          Session ID: {selectedSessionData.session.sessionId}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedSessionData.session.status === 'active' && (
                          <button
                            onClick={handleCloseSupportSession}
                            disabled={isClosingSession}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
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
                              <span className="text-[10px] font-extrabold text-gray-500 dark:text-dark-muted">
                                {isAdmin
                                  ? `You (Admin: ${msg.senderName})`
                                  : isUser
                                  ? msg.senderName || 'User'
                                  : 'Sprinkl Bot'}
                              </span>
                              <span className="text-[9px] text-gray-500 dark:text-dark-muted font-mono">
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
                                  ? 'bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-tl-none'
                                  : 'bg-gray-200/80 dark:bg-slate-900 border border-gray-300/80 dark:border-dark-border/80 text-gray-800 dark:text-slate-300 rounded-tl-none'
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
                                              className="max-h-36 rounded-lg object-cover border border-gray-200 dark:border-white/20"
                                            />
                                          </a>
                                        ) : (
                                          <a
                                            href={downloadUrl || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 rounded bg-black/5 dark:bg-black/20 text-[11px] font-mono text-gray-800 dark:text-slate-200"
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
                    <div className="p-3.5 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-slate-900/90 shrink-0">
                      <form onSubmit={handleSendAdminReply} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Type your official response to the user..."
                          value={adminReplyText}
                          onChange={(e) => setAdminReplyText(e.target.value)}
                          className="flex-1 bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-dark-muted focus:outline-none focus:border-brand-500"
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
                      <p className="text-[10px] text-gray-500 dark:text-dark-muted mt-1.5">
                        💡 Sending a response appears instantly in the user's widget and dispatches an email notification.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500 dark:text-dark-muted space-y-2">
                    <MessageSquare className="w-10 h-10 opacity-40" />
                    <p className="text-sm font-bold text-gray-800 dark:text-slate-300">Select a support conversation</p>
                    <p className="text-xs max-w-sm text-gray-500 dark:text-dark-muted">
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
          <section className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-4 sm:p-6 space-y-5 animate-in fade-in duration-150 shadow-sm dark:shadow-none">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-950 dark:text-white">Platform Giveaways Monitor</h2>
                <p className="text-xs text-gray-500 dark:text-dark-muted">
                  Inspect all dual-currency &amp; VTU airtime campaigns created across the platform
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
                  className="bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-dark-muted focus:outline-none focus:border-brand-500"
                />

                <select
                  value={giveawayStatusFilter}
                  onChange={(e) => {
                    setGiveawayStatusFilter(e.target.value);
                    setGiveawayPage(1);
                  }}
                  className="bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none"
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
                  className="bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none"
                >
                  <option value="all">All Currencies</option>
                  <option value="NGN">NGN (Naira)</option>
                  <option value="AIRTIME">Airtime (VTU)</option>
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
                      <tr className="border-b border-gray-200 dark:border-dark-border text-[11px] uppercase tracking-wider text-gray-500 dark:text-dark-muted bg-gray-50/50 dark:bg-transparent">
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
                    <div key={g._id} className="bg-gray-50 dark:bg-dark-bg rounded-xl border border-gray-200 dark:border-dark-border p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-gray-950 dark:text-white line-clamp-1">{g.title}</span>
                        <StatusBadge status={g.status} />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-dark-muted">
                        Host: <strong className="text-gray-900 dark:text-slate-200">{g.host?.fullName || 'Anonymous'}</strong> ({g.host?.email})
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span>
                          Prize: <strong className="text-gray-900 dark:text-slate-100">{formatCurrency(g.amountPerRecipient, g.currency)}</strong> / person
                        </span>
                        <span>
                          Slots: <strong className="text-brand-600 dark:text-brand-400">{g.slotsClaimed} / {g.totalSlots}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-dark-border text-[11px] uppercase tracking-wider text-gray-700 dark:text-slate-300 font-bold bg-gray-50/70 dark:bg-transparent">
                        <th className="py-3 px-3">Title &amp; Slug</th>
                        <th className="py-3 px-3">Host</th>
                        <th className="py-3 px-3">Currency</th>
                        <th className="py-3 px-3">Prize / Winner</th>
                        <th className="py-3 px-3">Slots Claimed</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-dark-border text-xs">
                      {giveawaysData.giveaways.map((g) => (
                        <tr key={g._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                          <td className="py-3.5 px-3">
                            <p className="font-bold text-gray-950 dark:text-white line-clamp-1">{g.title}</p>
                            <p className="text-[10px] font-mono text-gray-600 dark:text-slate-400">/g/{g.slug}</p>
                          </td>
                          <td className="py-3.5 px-3">
                            <p className="font-bold text-gray-950 dark:text-white">{g.host?.fullName || 'N/A'}</p>
                            <p className="text-[10px] text-gray-600 dark:text-slate-300 font-medium">{g.host?.email}</p>
                          </td>
                          <td className="py-3.5 px-3 font-bold text-gray-950 dark:text-white">{g.currency}</td>
                          <td className="py-3.5 px-3 font-mono font-bold text-gray-950 dark:text-white">
                            {formatCurrency(g.amountPerRecipient, g.currency)}
                          </td>
                          <td className="py-3.5 px-3 font-mono">
                            <span className="text-brand-600 dark:text-brand-400 font-bold">{g.slotsClaimed}</span>
                            <span className="text-gray-600 dark:text-slate-400 font-medium"> / {g.totalSlots}</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <StatusBadge status={g.status} />
                          </td>
                          <td className="py-3.5 px-3 text-right text-gray-600 dark:text-slate-400 font-medium whitespace-nowrap">
                            {new Date(g.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {giveawaysData.pagination?.totalPages > 1 && (
                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-dark-muted border-t border-gray-200 dark:border-dark-border/70">
                    <p>
                      Showing{' '}
                      <span className="font-semibold text-gray-900 dark:text-slate-200">
                        {(giveawayPage - 1) * giveawaysData.pagination.limit + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-semibold text-gray-900 dark:text-slate-200">
                        {Math.min(
                          giveawayPage * giveawaysData.pagination.limit,
                          giveawaysData.pagination.total
                        )}
                      </span>{' '}
                      of <span className="font-semibold text-gray-900 dark:text-slate-200">{giveawaysData.pagination.total}</span> giveaways
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setGiveawayPage((p) => Math.max(1, p - 1))}
                        disabled={giveawayPage === 1}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 disabled:opacity-40"
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
                              : 'bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
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
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-dark-muted py-8 text-center">No giveaways matching the filter criteria.</p>
            )}
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 4: EXTERNAL PROVIDER TRANSACTIONS (Paginated)
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'transactions' && (
          <section className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-4 sm:p-6 space-y-5 animate-in fade-in duration-150 shadow-sm dark:shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-950 dark:text-white">External Provider Audit Log</h2>
                <p className="text-xs text-gray-500 dark:text-dark-muted">
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
                  className="bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-dark-muted focus:outline-none focus:border-brand-500"
                />

                <select
                  value={txProviderFilter}
                  onChange={(e) => {
                    setTxProviderFilter(e.target.value);
                    setTxPage(1);
                  }}
                  className="bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none"
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
                      <tr className="border-b border-gray-200 dark:border-dark-border text-[11px] uppercase tracking-wider text-gray-500 dark:text-dark-muted bg-gray-50/50 dark:bg-transparent">
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
                    <div key={t._id} className="bg-gray-50 dark:bg-dark-bg rounded-xl border border-gray-200 dark:border-dark-border p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-brand-600 dark:text-brand-400 uppercase">{t.provider}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTxStatusBadge(t.status)}`}>
                          {t.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold capitalize ${
                            t.direction === 'inbound' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {t.direction}
                        </span>
                        <span className="text-xs font-mono font-bold text-gray-900 dark:text-white">
                          {formatCurrency(t.amount, t.currency, t.provider)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-dark-muted font-mono truncate">{t.providerReference}</p>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-dark-border text-[11px] uppercase tracking-wider text-gray-700 dark:text-slate-300 font-bold bg-gray-50/70 dark:bg-transparent">
                        <th className="py-3 px-3">Provider</th>
                        <th className="py-3 px-3">Reference</th>
                        <th className="py-3 px-3">Direction</th>
                        <th className="py-3 px-3">Amount</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-dark-border text-xs">
                      {txData.transactions.map((t) => (
                        <tr key={t._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-3 uppercase font-bold text-brand-600 dark:text-brand-400">{t.provider}</td>
                          <td className="py-3 px-3 font-mono text-xs text-gray-900 dark:text-slate-200 font-medium">{t.providerReference}</td>
                          <td className="py-3 px-3 capitalize font-semibold">
                            <span className={t.direction === 'inbound' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                              {t.direction}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-gray-950 dark:text-white">
                            {formatCurrency(t.amount, t.currency, t.provider)}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTxStatusBadge(t.status)}`}>
                              {t.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-gray-600 dark:text-slate-400 font-mono whitespace-nowrap">
                            {new Date(t.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {txData.pagination?.totalPages > 1 && (
                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-dark-muted border-t border-gray-200 dark:border-dark-border/70">
                    <p>
                      Showing{' '}
                      <span className="font-semibold text-gray-900 dark:text-slate-200">
                        {(txPage - 1) * txData.pagination.limit + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-semibold text-gray-900 dark:text-slate-200">
                        {Math.min(txPage * txData.pagination.limit, txData.pagination.total)}
                      </span>{' '}
                      of{' '}
                      <span className="font-semibold text-gray-900 dark:text-slate-200">{txData.pagination.total}</span> provider transactions
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                        disabled={txPage === 1}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 disabled:opacity-40"
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
                              : 'bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {n}
                        </button>
                      ))}

                      <button
                        onClick={() => setTxPage((p) => Math.min(txData.pagination.totalPages, p + 1))}
                        disabled={txPage === txData.pagination.totalPages}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-dark-muted py-8 text-center">No provider transactions logged yet.</p>
            )}
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 5: CLAIMS & WINNERS LEDGER (Paginated)
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'claims' && (
          <section className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-4 sm:p-6 space-y-5 animate-in fade-in duration-150 shadow-sm dark:shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-950 dark:text-white">Claims &amp; Winners Audit</h2>
                <p className="text-xs text-gray-500 dark:text-dark-muted">
                  Recipient destination accounts, claim amounts, and automated settlement results
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
                  className="bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-dark-muted focus:outline-none focus:border-brand-500"
                />

                <select
                  value={claimStatusFilter}
                  onChange={(e) => {
                    setClaimStatusFilter(e.target.value);
                    setClaimPage(1);
                  }}
                  className="bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid (Disbursed)</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>

                <select
                  value={claimCurrencyFilter}
                  onChange={(e) => {
                    setClaimCurrencyFilter(e.target.value);
                    setClaimPage(1);
                  }}
                  className="bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none"
                >
                  <option value="all">All Currencies</option>
                  <option value="NGN">NGN (Naira)</option>
                  <option value="AIRTIME">Airtime (VTU)</option>
                  <option value="USDT">USDT (Crypto)</option>
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
                      <tr className="border-b border-gray-200 dark:border-dark-border text-[11px] uppercase tracking-wider text-gray-500 dark:text-dark-muted bg-gray-50/50 dark:bg-transparent">
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
                    <div key={c._id} className="bg-gray-50 dark:bg-dark-bg rounded-xl border border-gray-200 dark:border-dark-border p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-950 dark:text-white truncate max-w-[200px]">
                          {c.giveaway?.title || 'Giveaway'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            c.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {c.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-gray-500 dark:text-dark-muted truncate">
                        {c.destination?.details?.accountName || c.destination?.details?.address || c.destination?.normalized}
                      </p>
                      <div className="flex items-center justify-between text-xs font-mono font-bold">
                        <span className="text-brand-600 dark:text-brand-400">{formatCurrency(c.amount, c.currency || c.giveaway?.currency || 'NGN')}</span>
                        <span className="text-gray-500 dark:text-dark-muted">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-dark-border text-[11px] uppercase tracking-wider text-gray-700 dark:text-slate-300 font-bold bg-gray-50/70 dark:bg-transparent">
                        <th className="py-3 px-3">Giveaway Title</th>
                        <th className="py-3 px-3">Beneficiary Destination</th>
                        <th className="py-3 px-3">Amount</th>
                        <th className="py-3 px-3">Currency</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Claimed At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-dark-border text-xs">
                      {claimsData.claims.map((c) => (
                        <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-3 font-bold text-gray-950 dark:text-white max-w-[220px] truncate">
                            {c.giveaway?.title || 'Giveaway'}
                          </td>
                          <td className="py-3 px-3 font-mono text-xs">
                            <p className="font-bold text-gray-950 dark:text-white">
                              {c.destination?.details?.accountName || c.destination?.details?.bankName || 'Direct Destination'}
                            </p>
                            <p className="text-[10px] text-gray-600 dark:text-slate-300 font-medium truncate max-w-[280px]">
                              {c.destination?.details?.accountNumber || c.destination?.details?.address || c.destination?.normalized}
                            </p>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(c.amount, c.currency || c.giveaway?.currency || 'NGN')}
                          </td>
                          <td className="py-3 px-3 font-bold text-gray-950 dark:text-white">{c.currency || c.giveaway?.currency || 'NGN'}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                c.status === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                              }`}
                            >
                              {c.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-gray-600 dark:text-slate-400 font-mono whitespace-nowrap">
                            {new Date(c.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {claimsData.pagination?.totalPages > 1 && (
                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-dark-muted border-t border-gray-200 dark:border-dark-border/70">
                    <p>
                      Showing{' '}
                      <span className="font-semibold text-gray-900 dark:text-slate-200">
                        {(claimPage - 1) * claimsData.pagination.limit + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-semibold text-gray-900 dark:text-slate-200">
                        {Math.min(claimPage * claimsData.pagination.limit, claimsData.pagination.total)}
                      </span>{' '}
                      of <span className="font-semibold text-gray-900 dark:text-slate-200">{claimsData.pagination.total}</span> claims
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setClaimPage((p) => Math.max(1, p - 1))}
                        disabled={claimPage === 1}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 disabled:opacity-40"
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
                              : 'bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {n}
                        </button>
                      ))}

                      <button
                        onClick={() => setClaimPage((p) => Math.min(claimsData.pagination.totalPages, p + 1))}
                        disabled={claimPage === claimsData.pagination.totalPages}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-dark-muted py-8 text-center">No claims found.</p>
            )}
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 6: USERS & KYC DIRECTORY (Paginated)
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <section className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-4 sm:p-6 space-y-5 animate-in fade-in duration-150 shadow-sm dark:shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-950 dark:text-white">Users &amp; Roles Management</h2>
                <p className="text-xs text-gray-500 dark:text-dark-muted">
                  Directory of registered hosts, platform administrators, and live ledger balances
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Real-time Activity Filter Pills */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-bg p-1 rounded-xl border border-gray-200 dark:border-dark-border text-xs">
                  {[
                    { id: 'all', label: 'All Users' },
                    { id: 'online', label: '🟢 Active Now', count: usersData?.stats?.onlineCount || reportData?.users?.activeNow },
                    { id: 'today', label: 'Active Today', count: usersData?.stats?.activeTodayCount || reportData?.users?.activeToday },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setUserActivityFilter(f.id);
                        setUserPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                        userActivityFilter === f.id
                          ? 'bg-white dark:bg-dark-card text-gray-950 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-dark-muted hover:text-gray-950 dark:hover:text-white'
                      }`}
                    >
                      {f.label} {f.count !== undefined && f.count > 0 ? `(${f.count})` : ''}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  className="bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-dark-muted focus:outline-none focus:border-brand-500"
                />

                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value);
                    setUserPage(1);
                  }}
                  className="bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none"
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
                      <tr className="border-b border-gray-200 dark:border-dark-border text-[11px] uppercase tracking-wider text-gray-500 dark:text-dark-muted bg-gray-50/50 dark:bg-transparent">
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
                    <div key={u._id} className="bg-gray-50 dark:bg-dark-bg rounded-xl border border-gray-200 dark:border-dark-border p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-gray-950 dark:text-white">{u.fullName}</span>
                          {u.isOnline && (
                            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Online now"></span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            u.role === 'admin'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20'
                          }`}
                        >
                          {u.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-dark-muted">{u.email}</p>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span>NGN: <strong className="text-gray-900 dark:text-slate-200">{formatCurrency(u.balances?.NGN?.available || 0, 'NGN')}</strong></span>
                        <span>USDT: <strong className="text-gray-900 dark:text-slate-200">{formatCurrency(u.balances?.USDT?.available || 0, 'USDT')}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-dark-border text-[11px] uppercase tracking-wider text-gray-700 dark:text-slate-300 font-bold bg-gray-50/70 dark:bg-transparent">
                        <th className="py-3 px-3">User</th>
                        <th className="py-3 px-3">Role</th>
                        <th className="py-3 px-3">Email Verified</th>
                        <th className="py-3 px-3">Payment Limit</th>
                        <th className="py-3 px-3">NGN Balance</th>
                        <th className="py-3 px-3">USDT Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-dark-border text-xs">
                      {usersData.users.map((u) => (
                        <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-950 dark:text-white">{u.fullName}</p>
                              {u.isOnline ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  Online
                                </span>
                              ) : u.lastActiveAt ? (
                                <span className="text-[10px] text-gray-500 dark:text-slate-400">
                                  Active {new Date(u.lastActiveAt).toLocaleDateString()}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[10px] text-gray-600 dark:text-slate-300 font-medium">{u.email}</p>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                u.role === 'admin'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  : 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-bold ${
                                u.emailVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
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
                                  className="w-24 bg-white dark:bg-dark-bg border border-brand-500 rounded px-1.5 py-0.5 text-xs text-gray-900 dark:text-white font-mono"
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
                                  className="text-[10px] text-gray-400 hover:text-gray-900 dark:hover:text-white px-1"
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
                                className="font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                              >
                                <span>₦{((u.kyc?.payoutReviewThreshold || 50000000) / 100).toLocaleString()}</span>
                                <span className="text-[10px] text-gray-500 dark:text-slate-400">✎</span>
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-gray-950 dark:text-white">
                            {formatCurrency(u.balances?.NGN?.available || 0, 'NGN')}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-gray-950 dark:text-white">
                            {formatCurrency(u.balances?.USDT?.available || 0, 'USDT')}
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {usersData.pagination?.totalPages > 1 && (
                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-dark-muted border-t border-gray-200 dark:border-dark-border/70">
                    <p>
                      Showing{' '}
                      <span className="font-semibold text-gray-900 dark:text-slate-200">
                        {(userPage - 1) * usersData.pagination.limit + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-semibold text-gray-900 dark:text-slate-200">
                        {Math.min(userPage * usersData.pagination.limit, usersData.pagination.total)}
                      </span>{' '}
                      of <span className="font-semibold text-gray-900 dark:text-slate-200">{usersData.pagination.total}</span> users
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                        disabled={userPage === 1}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 disabled:opacity-40"
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
                              : 'bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {n}
                        </button>
                      ))}

                      <button
                        onClick={() => setUserPage((p) => Math.min(usersData.pagination.totalPages, p + 1))}
                        disabled={userPage === usersData.pagination.totalPages}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-dark-muted py-8 text-center">No users matching search.</p>
            )}
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB: DEDICATED ADMINS & STAFF MANAGEMENT (Admin Model)
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'admins' && (
          <section className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-4 sm:p-6 space-y-6 animate-in fade-in duration-150 shadow-sm dark:shadow-none">
            {/* Header & Action Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-dark-border/60">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-950 dark:text-white">Platform Administrators &amp; Staff</h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Dedicated Admin Model
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-dark-muted mt-0.5">
                  Decoupled administrative accounts with 2FA protection and granular privileges (Superadmin, Admin, Moderator)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => refetchAdmins()}
                  className="p-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 transition-all shadow-sm"
                  title="Refresh admin staff list"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setAdminModalOpen(true)}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm shadow-purple-500/20 active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Administrator</span>
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 dark:bg-dark-bg p-3.5 rounded-xl border border-gray-200 dark:border-dark-border">
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-dark-muted">Total Admin Staff</p>
                <p className="text-xl font-black text-gray-950 dark:text-white mt-1">{adminsData?.total ?? 0}</p>
              </div>
              <div className="bg-gray-50 dark:bg-dark-bg p-3.5 rounded-xl border border-gray-200 dark:border-dark-border">
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-dark-muted">Active Accounts</p>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {adminsData?.admins?.filter((a) => a.isActive).length ?? 0}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-dark-bg p-3.5 rounded-xl border border-gray-200 dark:border-dark-border">
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-dark-muted">Superadmins</p>
                <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">
                  {adminsData?.admins?.filter((a) => a.role === 'superadmin').length ?? 0}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-dark-bg p-3.5 rounded-xl border border-gray-200 dark:border-dark-border">
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-dark-muted">Architecture</p>
                <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mt-2 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                  Isolated DB Schema
                </p>
              </div>
            </div>

            {/* Administrators Table */}
            {adminsLoading ? (
              <TableSkeleton columns={5} rows={4} />
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-dark-border shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-dark-muted">
                        <th className="py-3 px-4">Staff Member</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Last Active</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-dark-border text-xs">
                      {adminsData?.admins && adminsData.admins.length > 0 ? (
                        adminsData.admins.map((adm) => (
                          <tr key={adm._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                                  {adm.fullName?.charAt(0) || 'A'}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-950 dark:text-white">{adm.fullName}</p>
                                  <p className="text-[11px] text-gray-500 dark:text-dark-muted">{adm.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                  adm.role === 'superadmin'
                                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                                    : adm.role === 'moderator'
                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                }`}
                              >
                                {adm.role || 'admin'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${
                                  adm.isActive
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-gray-400 dark:text-dark-muted'
                                }`}
                              >
                                <span
                                  className={`h-2 w-2 rounded-full ${
                                    adm.isActive ? 'bg-emerald-500' : 'bg-gray-400'
                                  }`}
                                />
                                {adm.isActive ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-gray-600 dark:text-slate-300 text-[11px]">
                              {adm.lastActiveAt
                                ? new Date(adm.lastActiveAt).toLocaleString()
                                : adm.lastLoginAt
                                ? `Logged in ${new Date(adm.lastLoginAt).toLocaleDateString()}`
                                : 'Never'}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleToggleAdminStatus(adm)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                  adm.isActive
                                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                }`}
                              >
                                {adm.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-xs text-gray-500 dark:text-dark-muted">
                            No dedicated administrators found. Click &quot;Add Administrator&quot; to create one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Legacy Admin Users notification if any exist */}
                {adminsData?.legacyAdminUsers && adminsData.legacyAdminUsers.length > 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                        Legacy User-Model Admins Detected ({adminsData.legacyAdminUsers.length})
                      </p>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-slate-300">
                      These users currently have administrative privileges via the User model. For complete isolation, add them as dedicated administrators above and revert their user accounts to standard hosts.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {adminsData.legacyAdminUsers.map((u) => (
                        <span
                          key={u._id}
                          className="text-[10px] font-medium bg-white dark:bg-dark-bg px-2.5 py-1 rounded-lg border border-amber-500/30 text-gray-900 dark:text-white"
                        >
                          {u.fullName} ({u.email})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 7: PAYMENT THRESHOLD REQUESTS (Paginated)
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'kyc' && (
          <section className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-4 sm:p-6 space-y-5 animate-in fade-in duration-150 shadow-sm dark:shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-950 dark:text-white">Payment Threshold Upgrade Requests</h2>
                <p className="text-xs text-gray-500 dark:text-dark-muted">
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
                  className="bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none"
                >
                  <option value="pending">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="all">All Requests</option>
                </select>
                <button
                  onClick={() => refetchKycRequests()}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 hover:text-gray-950 dark:hover:text-white transition-all shadow-sm"
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
                      <tr className="border-b border-gray-200 dark:border-dark-border text-[11px] uppercase tracking-wider text-gray-500 dark:text-dark-muted bg-gray-50/50 dark:bg-transparent">
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
                      <tr className="border-b border-gray-200 dark:border-dark-border text-[11px] uppercase tracking-wider text-gray-700 dark:text-slate-300 font-bold bg-gray-50/70 dark:bg-transparent">
                        <th className="py-3 px-3">User</th>
                        <th className="py-3 px-3">Current Limit</th>
                        <th className="py-3 px-3">Requested Limit</th>
                        <th className="py-3 px-3">Reason</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-dark-border text-xs">
                      {kycRequestsData.requests.map((r) => {
                        const status = r.kyc?.requestStatus || 'none';
                        const currentNaira = ((r.kyc?.payoutReviewThreshold || 50000000) / 100).toLocaleString();
                        const requestedNaira = ((r.kyc?.requestedThreshold || 0) / 100).toLocaleString();

                        return (
                          <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                            <td className="py-3 px-3">
                              <p className="font-bold text-gray-950 dark:text-white">{r.fullName}</p>
                              <p className="text-[10px] text-gray-600 dark:text-slate-300 font-medium">{r.email}</p>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-gray-950 dark:text-white">
                              ₦{currentNaira}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                              ₦{requestedNaira}
                            </td>
                            <td className="py-3 px-3 max-w-xs">
                              <p className="text-xs text-gray-800 dark:text-slate-200 font-medium truncate" title={r.kyc?.requestReason}>
                                {r.kyc?.requestReason || '—'}
                              </p>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                  status === 'approved'
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                    : status === 'rejected'
                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                }`}
                              >
                                {status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-[11px] text-gray-500 dark:text-dark-muted whitespace-nowrap">
                              {r.kyc?.requestedAt
                                ? new Date(r.kyc.requestedAt).toLocaleDateString()
                                : '—'}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {status === 'pending' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleKycReview(r._id, 'approve', r.kyc.requestedThreshold)}
                                    className="px-2.5 py-1 rounded-lg bg-brand-500 hover:bg-brand-600 text-slate-950 text-[11px] font-bold transition-all shadow-sm"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleKycReview(r._id, 'reject')}
                                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[11px] font-bold transition-all"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-500 dark:text-dark-muted uppercase font-bold">
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
                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-dark-muted border-t border-gray-200 dark:border-dark-border/70">
                    <p>
                      Showing{' '}
                      <span className="font-semibold text-gray-900 dark:text-slate-200">
                        {(kycPage - 1) * kycRequestsData.pagination.limit + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-semibold text-gray-900 dark:text-slate-200">
                        {Math.min(kycPage * kycRequestsData.pagination.limit, kycRequestsData.pagination.total)}
                      </span>{' '}
                      of <span className="font-semibold text-gray-900 dark:text-slate-200">{kycRequestsData.pagination.total}</span> requests
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setKycPage((p) => Math.max(1, p - 1))}
                        disabled={kycPage === 1}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 disabled:opacity-40"
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
                              : 'bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {n}
                        </button>
                      ))}

                      <button
                        onClick={() => setKycPage((p) => Math.min(kycRequestsData.pagination.totalPages, p + 1))}
                        disabled={kycPage === kycRequestsData.pagination.totalPages}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-dark-muted py-8 text-center">
                No payment threshold requests in this category.
              </p>
            )}
          </section>
        )}
      </main>

      {/* ─── ADD ADMINISTRATOR MODAL ─── */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-dark-border/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-gray-950 dark:text-white">Add Administrator</h3>
              </div>
              <button
                onClick={() => setAdminModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:text-dark-muted dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="e.g. Platform Supervisor"
                  className="w-full bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@sprinkl.biz"
                  className="w-full bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Privilege Role
                </label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value)}
                  className="w-full bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="admin">Administrator (Platform operations &amp; support desk)</option>
                  <option value="superadmin">Superadmin (Full administrative access &amp; staff management)</option>
                  <option value="moderator">Moderator (Live support &amp; giveaways monitor only)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdminModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-purple-500/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creatingAdmin ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Administrator</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
