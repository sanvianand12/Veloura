import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { DashboardLayout } from './components/DashboardLayout';
import { DashboardOverview } from './pages/DashboardOverview';
import { CreateEventPage } from './pages/CreateEventPage';
import { EventWorkspacePage } from './pages/EventWorkspacePage';
import { MasterPlanPage } from './pages/MasterPlanPage';
import { AIStudioPage } from './pages/modules/AIStudioPage';
import { BudgetPlannerPage } from './pages/modules/BudgetPlannerPage';
import { VendorMatchPage } from './pages/modules/VendorMatchPage';
import { TimelinePage } from './pages/modules/TimelinePage';
import { InclusiveCheckerPage } from './pages/modules/InclusiveCheckerPage';
import { WhatIfSimulatorPage } from './pages/modules/WhatIfSimulatorPage';
import { InvitationCreatorPage } from './pages/modules/InvitationCreatorPage';
import { AuthProvider, ProtectedRoute } from './services/auth';
import { RegisterPage, SignInPage, ForgotPasswordPage, ResetPasswordPage } from './pages/AuthPages';

export const App: React.FC = () => {
  return (
    <BrowserRouter><AuthProvider>
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
    </AuthProvider></BrowserRouter>
  );
};

export default App;

