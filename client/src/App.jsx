import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import './App.css';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HandoverPage from './pages/HandoverPage';
import AIBriefPage from './pages/AIBriefPage';
import SearchPage from './pages/SearchPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import FacultyListPage from './pages/FacultyListPage';
import FacultyProfilePage from './pages/FacultyProfilePage';
import RoleDirectoryPage from './pages/RoleDirectoryPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * AppLayout — Navbar + Sidebar shell for authenticated pages
 */
const AppLayout = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
    <Navbar />
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto h-[calc(100vh-64px)] relative">
        {/* Background decorative gradient */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes — any authenticated user */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                {/* All users */}
                <Route path="/" element={<DashboardPage />} />
                <Route path="/handover" element={<HandoverPage />} />
                <Route path="/ai-brief" element={<AIBriefPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* Admin-only routes */}
                <Route element={<ProtectedRoute requiredRole="Admin" />}>
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/faculty" element={<FacultyListPage />} />
                  <Route path="/faculty/:id" element={<FacultyProfilePage />} />
                  <Route path="/roles" element={<RoleDirectoryPage />} />
                </Route>

                {/* 404 catch-all inside layout */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>

            {/* 404 catch-all outside layout */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
