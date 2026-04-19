import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';

import Layout from './components/ui/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import QuizzesPage from './pages/QuizzesPage';
import QuizPlayPage from './pages/QuizPlayPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ChallengesPage from './pages/ChallengesPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import MissionsPage from './pages/MissionsPage';
import ActivityLoggerPage from './pages/ActivityLoggerPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import TeacherRegisterPage from './pages/TeacherRegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import NotificationToast from './components/ui/NotificationToast';
import LoadingScreen from './components/ui/LoadingScreen';

function ProtectedRoute({ children, adminOnly = false, teacherOnly = false }) {
  const { isAuthenticated, loading, isAdmin, user } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  if (teacherOnly && !['teacher', 'admin'].includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <NotificationToast />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/teacher/register" element={<PublicRoute><TeacherRegisterPage /></PublicRoute>} />

        {/* All protected pages share the Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard"   element={<DashboardPage />} />
          <Route path="/quizzes"     element={<QuizzesPage />} />
          <Route path="/missions"    element={<MissionsPage />} />
          <Route path="/challenges"  element={<ChallengesPage />} />
          <Route path="/activities"  element={<ActivityLoggerPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile"     element={<ProfilePage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          {/* Teacher-only */}
          <Route path="/teacher" element={
            <ProtectedRoute teacherOnly><TeacherDashboardPage /></ProtectedRoute>
          } />
        </Route>

        {/* Full-screen quiz player */}
        <Route path="/quiz/:id/play" element={<ProtectedRoute><QuizPlayPage /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
