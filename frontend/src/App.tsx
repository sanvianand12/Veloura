import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './services/auth';

const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const DashboardLayout = lazy(() => import('./components/DashboardLayout').then((m) => ({ default: m.DashboardLayout })));
const DashboardOverview = lazy(() => import('./pages/DashboardOverview').then((m) => ({ default: m.DashboardOverview })));
const CreateEventPage = lazy(() => import('./pages/CreateEventPage').then((m) => ({ default: m.CreateEventPage })));
const EventWorkspacePage = lazy(() => import('./pages/EventWorkspacePage').then((m) => ({ default: m.EventWorkspacePage })));
const MasterPlanPage = lazy(() => import('./pages/MasterPlanPage').then((m) => ({ default: m.MasterPlanPage })));
const AIStudioPage = lazy(() => import('./pages/modules/AIStudioPage').then((m) => ({ default: m.AIStudioPage })));
const BudgetPlannerPage = lazy(() => import('./pages/modules/BudgetPlannerPage').then((m) => ({ default: m.BudgetPlannerPage })));
const VendorMatchPage = lazy(() => import('./pages/modules/VendorMatchPage').then((m) => ({ default: m.VendorMatchPage })));
const TimelinePage = lazy(() => import('./pages/modules/TimelinePage').then((m) => ({ default: m.TimelinePage })));
const InclusiveCheckerPage = lazy(() => import('./pages/modules/InclusiveCheckerPage').then((m) => ({ default: m.InclusiveCheckerPage })));
const WhatIfSimulatorPage = lazy(() => import('./pages/modules/WhatIfSimulatorPage').then((m) => ({ default: m.WhatIfSimulatorPage })));
const InvitationCreatorPage = lazy(() => import('./pages/modules/InvitationCreatorPage').then((m) => ({ default: m.InvitationCreatorPage })));
const RegisterPage = lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.RegisterPage })));
const SignInPage = lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.SignInPage })));
const ForgotPasswordPage = lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.ResetPasswordPage })));

export const App: React.FC = () => {
  return (
    <BrowserRouter><AuthProvider><Suspense fallback={<div className="min-h-screen bg-ivory-50" aria-label="Loading page" />}>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Event Workspace — standalone, outside the dashboard shell */}
        <Route path="/events/:eventId/workspace" element={<ProtectedRoute><EventWorkspacePage /></ProtectedRoute>} />

        {/* Master Plan — standalone document view */}
        <Route path="/events/:eventId/master-plan" element={<ProtectedRoute><MasterPlanPage /></ProtectedRoute>} />

        {/* Dashboard Shell with Nested Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardOverview />} />
          <Route path="create" element={<CreateEventPage />} />
          <Route path="studio" element={<AIStudioPage />} />
          <Route path="budget" element={<BudgetPlannerPage />} />
          <Route path="vendors" element={<VendorMatchPage />} />
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="inclusive" element={<InclusiveCheckerPage />} />
          <Route path="simulator" element={<WhatIfSimulatorPage />} />
          <Route path="invitations" element={<InvitationCreatorPage />} />
        </Route>

        {/* Fallback to Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense></AuthProvider></BrowserRouter>
  );
};

export default App;

