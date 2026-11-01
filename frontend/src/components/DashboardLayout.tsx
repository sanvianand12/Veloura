import React, { useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { HealthBadge } from './HealthBadge';
import { Menu, Plus, LogOut } from 'lucide-react';
import { useAuth } from '../services/auth';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getPageTitle = () => {
    if (location.pathname.startsWith('/events/') && location.pathname.endsWith('/workspace')) {
      return 'Event Workspace';
    }
    if (location.pathname.startsWith('/events/') && location.pathname.endsWith('/master-plan')) {
      return 'Master Plan';
    }
    switch (location.pathname) {
      case '/dashboard':           return 'My Events';
      case '/dashboard/create':    return 'Create New Event';
      case '/dashboard/studio':    return 'AI Event Studio';
      case '/dashboard/budget':    return 'Budget Planner';
      case '/dashboard/vendors':   return 'VendorMatch';
      case '/dashboard/timeline':  return 'Timeline & Tasks';
      case '/dashboard/inclusive': return 'Inclusive Event Checker';
      case '/dashboard/simulator': return 'What-if Simulator';
      case '/dashboard/invitations': return 'Invitation Creator';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-ivory-50 text-ivory-900 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-ivory-50/90 backdrop-blur-md border-b border-ivory-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-ivory-700 hover:bg-ivory-200 transition-colors"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-terracotta-600 uppercase">
                Plan beautifully · Celebrate effortlessly
              </div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-ivory-900">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <HealthBadge />

            <Link
              to="/dashboard/create"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50 shadow-warm-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Event</span>
            </Link>

            <span className="hidden md:block text-sm text-ivory-700">{user?.name}</span>
            <button type="button" onClick={async () => { await logout(); navigate('/sign-in', { replace: true }); }} title="Sign out" aria-label="Sign out" className="w-9 h-9 rounded-full bg-teal-800 text-white grid place-items-center hover:bg-teal-900"><LogOut size={16}/></button>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

