import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import CreateGiveawayPage from './pages/CreateGiveawayPage';
import GiveawayDetailPage from './pages/GiveawayDetailPage';
import PublicClaimPage from './pages/PublicClaimPage';
import ClaimSuccessPage from './pages/ClaimSuccessPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import NotificationCenter from './components/NotificationCenter';
import SupportChatWidget from './components/SupportChatWidget';
import { useAuthStore } from './store/useAuthStore';

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
  const logout = useAuthStore((state) => state.logout);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If token is expired and no refresh token is present, auto logout immediately
  if (!isTokenValid(token) && !refreshToken) {
    logout();
    return <Navigate to="/login?expired=true" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.accessToken);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <>
      <NotificationCenter />
      <SupportChatWidget />
      <Routes>
        <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

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

      {/* Email Verification */}
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
