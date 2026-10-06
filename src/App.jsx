import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import SettingsPage from './pages/SettingsPage';
import DashboardPage from './pages/DashboardPage';
import CreateGiveawayPage from './pages/CreateGiveawayPage';
import GiveawayDetailPage from './pages/GiveawayDetailPage';
import PublicClaimPage from './pages/PublicClaimPage';
import ClaimSuccessPage from './pages/ClaimSuccessPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import NotificationCenter from './components/NotificationCenter';
import SupportChatWidget from './components/SupportChatWidget';
import { useAuthStore } from './store/useAuthStore';
import { identifyUser, pingUser } from './lib/socket';
import api from './api/client';

function isTokenValid(token) {
  if (!token) return false;
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return false;
    const payload = JSON.parse(atob(payloadBase64));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false; // Expired
    }
    return true;
  } catch {
    return false;
  }
}

function ProtectedRoute({ children }) {
  const token = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If token is expired and no refresh token is present, auto logout immediately
  if (!isTokenValid(token) && !refreshToken) {
    logout();
    return <Navigate to="/login?expired=true" replace />;
  }

  // If user is not verified, require verification before allowing access
  if (user && user.emailVerified === false) {
    logout();
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const token = useAuthStore((state) => state.accessToken);
  const [authStatus, setAuthStatus] = React.useState('checking'); // 'checking' | 'authorized' | 'unauthorized'

  React.useEffect(() => {
    let isMounted = true;

    if (!token) {
      setAuthStatus('unauthorized');
      return;
    }

    // Zero-trust verification: Never trust client-side localStorage/cookies for administrative privileges.
    // Query the server directly with the cryptographic JWT token to verify genuine admin authority.
    api
      .get('/auth/me')
      .then((res) => {
        if (!isMounted) return;
        const isAdmin = res.data?.isAdmin === true || res.data?.user?.role === 'admin';
        if (isAdmin) {
          setAuthStatus('authorized');
        } else {
          setAuthStatus('unauthorized');
        }
      })
      .catch(() => {
        if (isMounted) {
          setAuthStatus('unauthorized');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  // While validating credentials with the server, do not render any admin page contents
  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Verifying administrator access...</span>
        </div>
      </div>
    );
  }

  // If not a verified admin, immediately kick out and redirect to homepage ('/')
  if (authStatus !== 'authorized') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  const token = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  // Register online presence via Socket.IO & send periodic heartbeat
  React.useEffect(() => {
    if (!token) return;

    // Identify with real-time socket layer
    identifyUser(token, user?.id || user?._id);

    // Initial heartbeat
    api.post('/auth/heartbeat').catch(() => {});

    // Periodic heartbeat every 60s
    const timer = setInterval(() => {
      pingUser();
      api.post('/auth/heartbeat').catch(() => {});
    }, 60000);

    return () => clearInterval(timer);
  }, [token, user?.id, user?._id]);

  return (
    <>
      <NotificationCenter />
      <SupportChatWidget />
      <Routes>
        <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected Host Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/create"
        element={
          <ProtectedRoute>
            <CreateGiveawayPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/giveaway/:id"
        element={
          <ProtectedRoute>
            <GiveawayDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        }
      />

      {/* Public Giveaway Claim Routes */}
      <Route path="/g/:slug" element={<PublicClaimPage />} />
      <Route path="/g/:slug/claim/:claimId/success" element={<ClaimSuccessPage />} />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
