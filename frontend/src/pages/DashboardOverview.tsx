import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Event, EventStats } from '../types';
import {
  Calendar,
  Users,
  MapPin,
  Sparkles,
  Plus,
  Trash2,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  IndianRupee,
  CheckCircle2,
  Clock,
  PartyPopper,
} from 'lucide-react';

/** Format a number as Indian Rupees with lakh/crore grouping */
function formatINR(value: number): string {
  return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

/** Days until a date string (YYYY-MM-DD). Returns null if unparseable. */
function daysUntil(dateStr: string): number | null {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

const statusColors: Record<string, string> = {
  Planning:  'bg-marigold-100 text-marigold-800 border-marigold-200',
  Confirmed: 'bg-teal-100 text-teal-800 border-teal-200',
  Completed: 'bg-ivory-200 text-ivory-700 border-ivory-300',
  Cancelled: 'bg-terracotta-100 text-terracotta-700 border-terracotta-200',
};

export const DashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedEvents, fetchedStats] = await Promise.all([
        apiService.getEvents(),
        apiService.getStats(),
      ]);
      setEvents(fetchedEvents || []);
      setStats(fetchedStats || null);
    } catch (err: any) {
      setError(err?.message || 'Unable to connect to the Veloura backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Remove "${title}" from your events?`)) return;
    setDeletingId(id);
    try {
      await apiService.deleteEvent(id);
      await loadData();
    } catch (err: any) {
      alert(`Could not delete event: ${err?.message || 'Unknown error'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const upcomingEvents = events.filter((e) => {
    const s = (e.status || '').toLowerCase();
    return s === 'planning' || s === 'confirmed';
  });

  const totalBudget = stats?.total_budget ?? 0;
  const totalGuests = stats?.total_guests ?? 0;

  return (
    <div className="space-y-8 pb-8">

      {/* ── Welcome banner ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-terracotta-600 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Veloura</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ivory-900">
            Welcome back! 👋
          </h2>
          <p className="text-sm text-ivory-600 font-light mt-1">
            {upcomingEvents.length > 0
              ? `You have ${upcomingEvents.length} upcoming celebration${upcomingEvents.length > 1 ? 's' : ''} in progress.`
              : 'Ready to plan your next beautiful celebration?'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-ivory-100 hover:bg-ivory-200 border border-ivory-300 text-ivory-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/dashboard/create"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50 transition-all shadow-warm-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Event</span>
          </Link>
        </div>
      </div>

      {/* ── API error ───────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl bg-terracotta-50 border border-terracotta-200 text-terracotta-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-terracotta-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold block text-sm text-terracotta-900">Backend not reachable</span>
            <p className="mt-0.5 text-terracotta-700">{error}</p>
            <p className="mt-1 text-[11px]">
              Start the API: <code className="bg-terracotta-100 px-1.5 py-0.5 rounded font-mono">uvicorn app.main:app --reload</code>
            </p>
          </div>
        </div>
      )}

      {/* ── Summary metrics ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm">
          <div className="flex items-center justify-between text-ivory-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Upcoming Events</span>
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-ivory-900">
            {loading ? '…' : (stats?.upcoming_events ?? 0)}
          </div>
          <span className="text-[11px] text-teal-700 font-medium mt-1 block">
            {loading ? '' : `${stats?.total_events ?? 0} total recorded`}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm">
          <div className="flex items-center justify-between text-ivory-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Budget</span>
            <div className="w-8 h-8 rounded-lg bg-terracotta-100 text-terracotta-700 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-ivory-900 truncate">
            {loading ? '…' : formatINR(totalBudget)}
          </div>
          <span className="text-[11px] text-terracotta-700 font-medium mt-1 block">
            Across all events
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-ivory-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Guests</span>
            <div className="w-8 h-8 rounded-lg bg-marigold-100 text-marigold-800 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-ivory-900">
            {loading ? '…' : totalGuests.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-marigold-700 font-medium mt-1 block">
            {totalGuests > 0 && totalBudget > 0
              ? `${formatINR(Math.round(totalBudget / totalGuests))} / guest avg`
              : 'Expected attendees'}
          </span>
        </div>
      </div>

      {/* ── Your events ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl font-bold text-ivory-900">Your Events</h3>
          {events.length > 0 && (
            <span className="text-xs text-ivory-500">{events.length} event{events.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center rounded-2xl bg-ivory-100 border border-ivory-200">
            <RefreshCw className="w-6 h-6 text-terracotta-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-ivory-600">Loading your events…</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 sm:p-16 text-center rounded-2xl bg-ivory-100 border-2 border-dashed border-ivory-300">
            <div className="w-14 h-14 rounded-2xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-7 h-7" />
            </div>
            <h4 className="font-serif text-xl font-bold text-ivory-900">No events yet</h4>
            <p className="mt-2 text-sm text-ivory-600 font-light max-w-sm mx-auto">
              Create your first event and Veloura will guide you through every step of planning it.
            </p>
            <Link
              to="/dashboard/create"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50 shadow-warm-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Plan your first event</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {events.map((ev) => {
              const days = daysUntil(ev.date);
              const statusCls = statusColors[ev.status] ?? statusColors.Planning;
              return (
                <div
                  key={ev.id}
                  className="group flex flex-col rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm hover:shadow-warm transition-all overflow-hidden"
                >
                  {/* Card header strip */}
                  <div className="px-5 pt-5 pb-4 flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                        {ev.event_type}
                      </span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${statusCls}`}>
                        {ev.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-serif text-lg font-bold text-ivory-900 line-clamp-2 leading-snug">
                        {ev.title}
                      </h4>
                      {ev.theme && (
                        <p className="text-xs text-terracotta-600 font-medium italic mt-0.5 line-clamp-1">
                          {ev.theme}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-ivory-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-terracotta-500 shrink-0" />
                        <span>{ev.date}{ev.time ? ` · ${ev.time}` : ''}</span>
                        {days !== null && days >= 0 && (
                          <span className="ml-auto font-semibold text-teal-700">
                            {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `${days} days`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5 font-medium text-ivory-800">
                          <Users className="w-3.5 h-3.5 text-ivory-400" />
                          <span>{ev.guest_count.toLocaleString('en-IN')} guests</span>
                        </div>
                        <span className="font-serif font-bold text-sm text-terracotta-700">
                          {formatINR(ev.budget)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card footer: actions */}
                  <div className="px-5 py-3 border-t border-ivory-200 bg-ivory-50/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(ev.id, ev.title)}
                      disabled={deletingId === ev.id}
                      className="p-1.5 rounded-lg text-ivory-400 hover:text-terracotta-600 hover:bg-terracotta-50 transition-colors"
                      title="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <Link
                      to={`/events/${ev.id}/workspace`}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50 transition-all shadow-warm-sm"
                    >
                      <span>Continue Planning</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Quick tips when no events ────────────────────────────────── */}
      {!loading && events.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: Sparkles,
              color: 'bg-terracotta-100 text-terracotta-700',
              title: 'AI Event Concept',
              desc: 'Generate a theme, colour palette, décor ideas and menu sketches tailored to your celebration.',
            },
            {
              icon: IndianRupee,
              color: 'bg-marigold-100 text-marigold-700',
              title: 'RupeeWise Budget',
              desc: 'Allocate spending across categories, track expenses and build a contingency cushion in INR.',
            },
            {
              icon: CheckCircle2,
              color: 'bg-teal-100 text-teal-800',
              title: 'Guided Journey',
              desc: 'Veloura walks you through every stage — concept to invitations — and tells you what to do next.',
            },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="p-5 rounded-2xl bg-ivory-100 border border-ivory-200 space-y-2">
              <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </div>
              <h4 className="font-serif font-bold text-ivory-900">{title}</h4>
              <p className="text-xs text-ivory-600 font-light leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Upcoming tasks summary (when events exist) ───────────────── */}
      {!loading && upcomingEvents.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm">
          <div className="flex items-center gap-2 mb-4">
            <PartyPopper className="w-4 h-4 text-terracotta-600" />
            <h3 className="font-serif text-lg font-bold text-ivory-900">Next celebrations</h3>
          </div>
          <div className="space-y-3">
            {upcomingEvents.slice(0, 3).map((ev) => {
              const days = daysUntil(ev.date);
              return (
                <div key={ev.id} className="flex items-center justify-between gap-4 py-3 border-b border-ivory-200 last:border-0">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-ivory-900 truncate">{ev.title}</p>
                    <div className="flex items-center gap-3 text-xs text-ivory-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />{ev.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{ev.location}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {days !== null && days >= 0 && (
                      <span className="text-xs font-semibold text-teal-700 whitespace-nowrap">
                        {days === 0 ? 'Today!' : `${days}d`}
                      </span>
                    )}
                    <Link
                      to={`/events/${ev.id}/workspace`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta-600 hover:text-terracotta-800 transition-colors"
                    >
                      Plan <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
