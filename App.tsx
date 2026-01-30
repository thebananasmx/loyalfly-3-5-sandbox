
import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import MainLayout from './components/MainLayout';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import DocsLayout from './components/DocsLayout';
import AnalyticsTracker from './components/AnalyticsTracker';
import ScrollToTop from './components/ScrollToTop';

import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import TermsPage from './pages/TermsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CardEditorPage from './pages/CardEditorPage';
import StyleGuidePage from './pages/StyleGuidePage';
import PublicCardPage from './pages/PublicCardPage';
import NewCustomerPage from './pages/NewCustomerPage';
import ChangelogPage from './pages/ChangelogPage';
import EditCustomerPage from './pages/EditCustomerPage';
import SurveyPage from './pages/SurveyPage';
import PublicVotePage from './pages/PublicVotePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import SuperAdminProtectedRoute from './components/SuperAdminProtectedRoute';
import AdminLayout from './components/AdminLayout';
import UserFlowsPage from './pages/UserFlowsPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import AdminBlogListPage from './pages/AdminBlogListPage';
import AdminBlogEditorPage from './pages/AdminBlogEditorPage';
import MetricasPage from './pages/MetricasPage';
import AdminKpisPage from './pages/AdminKpisPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import AdminBusinessDetailPage from './pages/AdminBusinessDetailPage';

function App() {
  // Use BrowserRouter for production/Vercel domains and HashRouter for all other environments
  // (like local development and AI Studio previews) to ensure maximum compatibility.
  const isProductionLike = window.location.hostname.endsWith('loyalfly.com.mx') || window.location.hostname.includes('vercel.app');
  const Router = isProductionLike ? BrowserRouter : HashRouter;

  return (
    <AuthProvider>
      <Router>
        {/* Sandbox Floating Tag */}
        <div className="fixed top-24 left-0 z-[9999] pointer-events-none">
          <div className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-r-md shadow-2xl uppercase tracking-tighter border-y border-r border-red-700 animate-pulse pointer-events-auto cursor-default">
            Sandbox
          </div>
        </div>

        <ScrollToTop />
        <AnalyticsTracker />
        <Routes>
          {/* Public & Main Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/terminos" element={<TermsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            
            <Route path="/docs" element={<DocsLayout />}>
              <Route index element={<Navigate to="/docs/style-guide" replace />} />
              <Route path="style-guide" element={<StyleGuidePage />} />
              <Route path="changelog" element={<ChangelogPage />} />
              <Route path="flujos" element={<UserFlowsPage />} />
            </Route>
          </Route>
          
          {/* Public Card & Vote Routes (no layout) */}
          <Route path="/view/:slug" element={<PublicCardPage />} />
          <Route path="/vote/:slug" element={<PublicVotePage />} />

          {/* Business App Routes */}
          <Route 
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="tarjeta" element={<CardEditorPage />} />
            <Route path="metricas" element={<MetricasPage />} />
            <Route path="nuevo-cliente" element={<NewCustomerPage />} />
            <Route path="editar-cliente/:customerId" element={<EditCustomerPage />} />
            <Route path="vote" element={<SurveyPage />} />
            <Route path="settings" element={<AccountSettingsPage />} />
          </Route>

          {/* Super Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route 
            path="/admin"
            element={
              <SuperAdminProtectedRoute>
                <AdminLayout />
              </SuperAdminProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="business/:businessId" element={<AdminBusinessDetailPage />} />
            <Route path="kpis" element={<AdminKpisPage />} />
            <Route path="blog" element={<AdminBlogListPage />} />
            <Route path="blog/nuevo" element={<AdminBlogEditorPage />} />
            <Route path="blog/editar/:postId" element={<AdminBlogEditorPage />} />
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
