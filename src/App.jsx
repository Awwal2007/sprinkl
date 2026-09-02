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
import { useAuthStore } from './store/useAuthStore';

function ProtectedRoute({ children }) {
  const token = useAuthStore((state) => state.accessToken);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
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
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Public Giveaway Claim Routes */}
      <Route path="/g/:slug" element={<PublicClaimPage />} />
      <Route path="/g/:slug/claim/:claimId/success" element={<ClaimSuccessPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
