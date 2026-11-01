import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  WalletCards,
  Users2,
  CalendarClock,
  ShieldCheck,
  SlidersHorizontal,
  Mail,
  PlusCircle,
  ArrowLeft,
  Crown
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const navItems = [
  { name: 'Overview',            path: '/dashboard',             icon: LayoutDashboard, badge: null },
  { name: 'AI Event Studio',     path: '/dashboard/studio',      icon: Sparkles,        badge: null },
  { name: 'Budget Planner',      path: '/dashboard/budget',      icon: WalletCards,     badge: null },
  { name: 'VendorMatch',         path: '/dashboard/vendors',     icon: Users2,          badge: null },
  { name: 'Timeline & Tasks',    path: '/dashboard/timeline',    icon: CalendarClock,   badge: null },
  { name: 'Inclusive Checker',   path: '/dashboard/inclusive',   icon: ShieldCheck,     badge: null },
  { name: 'What-if Simulator',   path: '/dashboard/simulator',   icon: SlidersHorizontal, badge: null },
  { name: 'Invitation Creator',  path: '/dashboard/invitations', icon: Mail,            badge: null },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-ivory-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-ivory-100 border-r border-ivory-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-ivory-200">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-terracotta-600 text-ivory-50 flex items-center justify-center shadow-warm-sm group-hover:bg-terracotta-700 transition-colors">
              <span className="font-serif text-2xl font-bold tracking-tight">V</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-2xl font-semibold tracking-wide text-ivory-900">Veloura</span>
                <Crown className="w-3.5 h-3.5 text-marigold-500" />
              </div>
              <p className="text-[11px] uppercase tracking-wider text-terracotta-600 font-semibold">
                Event Architecture
              </p>
            </div>
          </Link>
        </div>

        {/* Quick Action: New Event */}
        <div className="p-4">
          <NavLink
            to="/dashboard/create"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all shadow-warm-sm ${
                isActive
                  ? 'bg-terracotta-700 text-ivory-50 ring-2 ring-terracotta-300'
                  : 'bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50 active:scale-[0.98]'
              }`
            }
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Event</span>
          </NavLink>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-ivory-500 uppercase">
            Planning Tools
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-800 text-ivory-50 shadow-warm-sm font-semibold'
                    : 'text-ivory-800 hover:bg-ivory-200/80 hover:text-ivory-900'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 opacity-90" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-ivory-200 text-teal-800 border border-ivory-300">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-ivory-200 space-y-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-medium text-ivory-700 hover:text-terracotta-600 transition-colors px-2 py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to home</span>
          </Link>

          <div className="px-3 py-2.5 rounded-xl bg-ivory-200/60 border border-ivory-300/60 text-xs">
            <p className="font-semibold text-ivory-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
              Veloura v0.1
            </p>
            <p className="text-ivory-600 text-[11px] mt-0.5">
              Plan beautifully · Celebrate effortlessly
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

