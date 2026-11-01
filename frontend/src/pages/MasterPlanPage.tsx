import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Event, EventPlanResponse, Vendor } from '../types';
import {
  ArrowLeft,
  Printer,
  ExternalLink,
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Sparkles,
  Palette,
  WalletCards,
  Users2,
  CalendarClock,
  ShieldCheck,
  SlidersHorizontal,
  Mail,
  CheckCircle2,
  Circle,
  AlertTriangle,
  RefreshCw,
  Edit3,
  Clock,
  ArrowRight,
  Star,
} from 'lucide-react';

function formatINR(v: number) {
  return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

const STAGE_META: Record<string, { label: string; icon: React.FC<any>; color: string }> = {
  concept:      { label: 'Event Concept',              icon: Palette,          color: 'text-terracotta-600' },
  budget:       { label: 'Budget Plan',                icon: WalletCards,      color: 'text-marigold-600' },
  vendors:      { label: 'Vendor Plan',                icon: Users2,           color: 'text-teal-700' },
  timeline:     { label: 'Timeline & Tasks',           icon: CalendarClock,    color: 'text-coral-600' },
  requirements: { label: 'Special Requirements',      icon: ShieldCheck,      color: 'text-teal-700' },
  what_if:      { label: 'What-if Planning',           icon: SlidersHorizontal, color: 'text-terracotta-600' },
  invitations:  { label: 'Invitations & Finalisation', icon: Mail,             color: 'text-marigold-600' },
};

interface SectionHeaderProps {
  stageId: string;
  completed: boolean;
  eventId: number;
  tab: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ stageId, completed, eventId, tab }) => {
  const meta = STAGE_META[stageId];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <div className="flex items-center justify-between mb-5 pb-4 border-b border-ivory-200 print:border-ivory-300">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg bg-ivory-200 flex items-center justify-center ${meta.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="font-serif text-xl font-bold text-ivory-900">{meta.label}</h2>
        {completed ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200">
            <CheckCircle2 className="w-3 h-3" /> Complete
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-ivory-600 bg-ivory-200 px-2 py-0.5 rounded-full border border-ivory-300">
            <Circle className="w-3 h-3" /> Pending
          </span>
        )}
      </div>
      <Link
        to={`/events/${eventId}/workspace`}
        state={{ tab }}
        className="no-print inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta-600 hover:text-terracotta-800 transition-colors"
        onClick={() => sessionStorage.setItem(`workspace_tab_${eventId}`, tab)}
      >
        <Edit3 className="w-3.5 h-3.5" />
        <span>Edit</span>
      </Link>
    </div>
  );
};

const EmptySection: React.FC<{ message: string; eventId: number; tab: string }> = ({ message, eventId, tab }) => (
  <div className="py-6 px-4 rounded-xl bg-ivory-50 border border-dashed border-ivory-300 text-center space-y-2">
    <p className="text-xs text-ivory-500">{message}</p>
    <Link
      to={`/events/${eventId}/workspace`}
      onClick={() => sessionStorage.setItem(`workspace_tab_${eventId}`, tab)}
      className="no-print inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta-600 hover:underline"
    >
      Complete this section <ArrowRight className="w-3 h-3" />
    </Link>
  </div>
);

export const MasterPlanPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [event, setEvent] = useState<Event | null>(null);
  const [plan, setPlan] = useState<EventPlanResponse | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    const id = Number(eventId);
    setLoading(true);
    Promise.all([
      apiService.getEvent(id),
      apiService.getEventPlan(id),
      apiService.getVendors(id),
    ])
      .then(([ev, pl, vl]) => {
        setEvent(ev);
        setPlan(pl);
        setVendors(vl || []);
      })
      .catch((err) => setError(err?.message || 'Failed to load master plan'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-terracotta-600 animate-spin mx-auto" />
          <p className="text-sm text-ivory-700">Loading your Master Plan…</p>
        </div>
      </div>
    );
  }

  if (error || !event || !plan) {
    return (
      <div className="min-h-screen bg-ivory-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-8">
          <AlertTriangle className="w-10 h-10 text-terracotta-500 mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-ivory-900">Plan not found</h2>
          <p className="text-sm text-ivory-600">{error || 'Event data could not be loaded.'}</p>
          <Link to="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-terracotta-600 text-ivory-50">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const concept      = plan.concept      as any;
  const budget       = plan.budget       as any;
  const vendorsData  = plan.vendors      as any;
  const timeline     = plan.timeline     as any;
  const requirements = plan.requirements as any;
  const whatIf       = plan.what_if      as any;
  const invitations  = plan.invitations  as any;

  const completedStages = new Set(plan.completed_stages);
  const totalAllocated  = (budget.categories || []).reduce((s: number, c: any) => s + (c.allocated || 0), 0);
  const totalSpent      = (budget.categories || []).reduce((s: number, c: any) => s + (c.spent || 0), 0);
  const shortlisted     = vendors.filter((v) => v.is_shortlisted);
  const tasks           = timeline.tasks || [];
  const completedTasks  = tasks.filter((t: any) => t.completed).length;
  const daysUntil       = (() => {
    const d = new Date(event.date);
    if (isNaN(d.getTime())) return null;
    const today = new Date(); today.setHours(0,0,0,0); d.setHours(0,0,0,0);
    return Math.round((d.getTime() - today.getTime()) / 86400000);
  })();

  return (
    <>
      {/* Print-only global style */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { box-shadow: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-ivory-50 print:bg-white">
        {/* ── Top nav (no-print) ─────────────────────────────────── */}
        <div className="no-print sticky top-0 z-30 bg-ivory-50/95 backdrop-blur-sm border-b border-ivory-200 px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
          <Link
            to={`/events/${event.id}/workspace`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-ivory-600 hover:text-terracotta-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Planning Workspace</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="text-xs font-semibold text-ivory-600 hover:text-terracotta-600 transition-colors"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-800 hover:bg-teal-900 text-ivory-50 transition-all shadow-warm-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* ── Master Plan Document ────────────────────────────────── */}
        <div ref={printRef} className="print-page max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-10">

          {/* ── Cover Header ─────────────────────────────────────── */}
          <div className="p-8 rounded-3xl bg-ivory-100 border border-ivory-200 shadow-warm-sm print:border-ivory-300 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-terracotta-50 text-terracotta-700 border border-terracotta-200 mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Master Plan · Veloura</span>
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ivory-900 leading-tight">
                  {event.title}
                </h1>
                {event.theme && (
                  <p className="mt-1 text-sm text-terracotta-600 italic font-medium">{event.theme}</p>
                )}
              </div>

              <div className="shrink-0 text-right">
                <div className={`text-3xl font-serif font-bold ${plan.progress_percentage === 100 ? 'text-teal-800' : 'text-terracotta-700'}`}>
                  {plan.progress_percentage}%
                </div>
                <div className="text-xs text-ivory-600 font-medium">Planning Complete</div>
                <div className="text-[11px] text-ivory-500 mt-0.5">{plan.completed_stages.length} of 7 stages done</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 rounded-full bg-ivory-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-terracotta-500 to-teal-600 transition-all"
                style={{ width: `${Math.max(plan.progress_percentage, 4)}%` }}
              />
            </div>

            {/* Event quick facts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Calendar, label: 'Date', value: `${event.date}${event.time ? ' · ' + event.time : ''}`, sub: daysUntil !== null && daysUntil >= 0 ? `${daysUntil} days away` : '' },
                { icon: MapPin,   label: 'Venue', value: event.location },
                { icon: Users,    label: 'Guests', value: `${event.guest_count.toLocaleString('en-IN')} attendees` },
                { icon: IndianRupee, label: 'Budget', value: formatINR(event.budget), sub: `${formatINR(totalSpent)} spent` },
              ].map(({ icon: Icon, label, value, sub }) => (
                <div key={label} className="p-3.5 rounded-xl bg-ivory-50 border border-ivory-200 text-xs">
                  <span className="text-ivory-500 block text-[10px] uppercase font-semibold mb-1">{label}</span>
                  <div className="font-semibold text-ivory-900 flex items-center gap-1.5 flex-wrap">
                    <Icon className="w-3.5 h-3.5 text-terracotta-500 shrink-0" />
                    <span>{value}</span>
                  </div>
                  {sub && <span className="text-[10px] text-teal-700 mt-0.5 block">{sub}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* ── 1. Event Concept ──────────────────────────────────── */}
          <section className="p-6 sm:p-8 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm print:border-ivory-300">
            <SectionHeader stageId="concept" completed={completedStages.has('concept')} eventId={event.id} tab="concept" />

            {concept?.theme ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ivory-500 mb-1">Theme</p>
                    <p className="font-serif text-xl font-bold text-ivory-900">{concept.theme}</p>
                    {concept.tagline && <p className="text-sm text-ivory-600 italic mt-1">"{concept.tagline}"</p>}
                  </div>
                  {(concept.palette || []).length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ivory-500 mb-2">Colour Palette</p>
                      <div className="flex flex-wrap gap-2">
                        {concept.palette.map((c: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-ivory-50 border border-ivory-200 text-xs">
                            <div className="w-5 h-5 rounded-md shadow-warm-sm border border-ivory-300 shrink-0" style={{ backgroundColor: c.hex }} />
                            <div>
                              <div className="font-semibold text-ivory-900">{c.name}</div>
                              <div className="text-[10px] font-mono text-ivory-500">{c.hex}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {(concept.decor_ideas || []).length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ivory-500 mb-2">Décor & Scenography</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {concept.decor_ideas.map((idea: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-ivory-800 p-2.5 rounded-lg bg-ivory-50 border border-ivory-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500 mt-1 shrink-0" />
                          {idea}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(concept.menu_suggestions || []).length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ivory-500 mb-2">Menu & Culinary Direction</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {concept.menu_suggestions.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-ivory-800 p-2.5 rounded-lg bg-ivory-50 border border-ivory-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1 shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(concept.entertainment_concepts || []).length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ivory-500 mb-2">Entertainment</p>
                    <div className="space-y-1.5">
                      {concept.entertainment_concepts.map((item: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-ivory-800 p-2.5 rounded-lg bg-ivory-50 border border-ivory-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-marigold-500 shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptySection message="No concept saved yet." eventId={event.id} tab="concept" />
            )}
          </section>

          {/* ── 2. Budget Plan ────────────────────────────────────── */}
          <section className="p-6 sm:p-8 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm print:border-ivory-300">
            <SectionHeader stageId="budget" completed={completedStages.has('budget')} eventId={event.id} tab="budget" />

            {(budget?.categories || []).length > 0 ? (
              <div className="space-y-6">
                {/* Summary row */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total Budget',   value: formatINR(budget.total_budget || event.budget), color: 'text-ivory-900' },
                    { label: 'Total Allocated', value: formatINR(totalAllocated), color: 'text-terracotta-700' },
                    { label: 'Remaining',       value: formatINR(Math.max(0, (budget.total_budget || event.budget) - totalSpent)), color: 'text-teal-800' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-ivory-500 mb-1">{label}</p>
                      <p className={`font-serif text-lg font-bold ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Category bars */}
                <div className="space-y-3">
                  {(budget.categories || []).map((cat: any) => {
                    const pct = cat.allocated > 0 ? Math.min(100, ((cat.spent || 0) / cat.allocated) * 100) : 0;
                    return (
                      <div key={cat.id} className="p-3.5 rounded-xl bg-ivory-50 border border-ivory-200">
                        <div className="flex items-center justify-between mb-1.5 text-xs">
                          <span className="font-semibold text-ivory-900">{cat.name}</span>
                          <span className="font-mono font-bold text-terracotta-700">{formatINR(cat.allocated)}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-ivory-200 overflow-hidden">
                          <div className="h-full rounded-full bg-teal-600" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-ivory-500 mt-1">
                          <span>Spent: {formatINR(cat.spent || 0)}</span>
                          <span>Left: {formatINR(Math.max(0, cat.allocated - (cat.spent || 0)))}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Expenses */}
                {(budget.expenses || []).length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ivory-500 mb-2">Recorded Expenses</p>
                    <div className="space-y-1.5">
                      {budget.expenses.map((exp: any) => (
                        <div key={exp.id} className="flex items-center justify-between p-2.5 rounded-lg bg-ivory-50 border border-ivory-200 text-xs">
                          <div>
                            <span className="font-semibold text-ivory-900">{exp.title}</span>
                            {exp.vendor && <span className="text-ivory-500 ml-1.5">· {exp.vendor}</span>}
                          </div>
                          <span className="font-mono font-bold text-terracotta-700">{formatINR(exp.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptySection message="Budget not yet configured." eventId={event.id} tab="budget" />
            )}
          </section>

          {/* ── 3. Vendor Plan ────────────────────────────────────── */}
          <section className="p-6 sm:p-8 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm print:border-ivory-300">
            <SectionHeader stageId="vendors" completed={completedStages.has('vendors') || shortlisted.length > 0} eventId={event.id} tab="vendors" />

            {shortlisted.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {shortlisted.map((v) => (
                  <div key={v.id} className="p-4 rounded-xl bg-ivory-50 border border-teal-200 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">{v.category}</span>
                      <span className="text-[10px] font-bold text-marigold-700">{v.match_score}% match</span>
                    </div>
                    <p className="font-serif font-bold text-ivory-900">{v.name}</p>
                    <p className="text-[11px] text-ivory-600">{v.location} · {v.price_tier} · ★ {v.rating}</p>
                    {v.is_demo && <span className="text-[10px] text-ivory-400 italic">Demo data</span>}
                  </div>
                ))}
              </div>
            ) : (
              <EmptySection message="No vendors shortlisted yet. Browse vendor recommendations in your workspace." eventId={event.id} tab="vendors" />
            )}
          </section>

          {/* ── 4. Timeline & Tasks ───────────────────────────────── */}
          <section className="p-6 sm:p-8 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm print:border-ivory-300">
            <SectionHeader stageId="timeline" completed={completedStages.has('timeline')} eventId={event.id} tab="timeline" />

            {tasks.length > 0 ? (
              <div className="space-y-5">
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-ivory-800">{completedTasks} of {tasks.length} tasks complete</span>
                  <div className="flex-1 h-1.5 rounded-full bg-ivory-200 overflow-hidden">
                    <div className="h-full rounded-full bg-teal-600" style={{ width: `${tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tasks.map((t: any) => (
                    <div key={t.id} className={`flex items-start gap-2.5 p-2.5 rounded-lg text-xs border ${t.completed ? 'bg-ivory-50/60 border-teal-200 opacity-75' : 'bg-ivory-50 border-ivory-200'}`}>
                      {t.completed
                        ? <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                        : <Circle className="w-4 h-4 text-ivory-400 shrink-0 mt-0.5" />}
                      <div>
                        <span className={`font-medium block ${t.completed ? 'line-through text-ivory-500' : 'text-ivory-900'}`}>{t.title}</span>
                        <span className="text-[10px] text-ivory-500">{t.category} · {t.priority}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {(timeline.day_of_schedule || []).length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ivory-500 mb-2">Event-Day Schedule</p>
                    <div className="space-y-2">
                      {timeline.day_of_schedule.map((cue: any) => (
                        <div key={cue.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-ivory-50 border border-ivory-200 text-xs">
                          <span className="font-serif font-bold text-terracotta-700 w-12 shrink-0">{cue.time}</span>
                          <div>
                            <span className="font-semibold text-ivory-900">{cue.title}</span>
                            {cue.description && <p className="text-ivory-600 font-light mt-0.5">{cue.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptySection message="No timeline tasks added yet." eventId={event.id} tab="timeline" />
            )}
          </section>

          {/* ── 5. Special Requirements ──────────────────────────── */}
          <section className="p-6 sm:p-8 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm print:border-ivory-300">
            <SectionHeader stageId="requirements" completed={completedStages.has('requirements')} eventId={event.id} tab="requirements" />

            {(requirements?.dietary_requirements?.length > 0 || requirements?.accessibility_requirements?.length > 0 || requirements?.personal_notes) ? (
              <div className="space-y-5">
                {(requirements.dietary_requirements || []).length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ivory-500 mb-2">Dietary Requirements</p>
                    <div className="flex flex-wrap gap-2">
                      {requirements.dietary_requirements.map((d: string, i: number) => (
                        <span key={i} className="text-xs font-medium px-3 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-200">{d}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(requirements.accessibility_requirements || []).length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ivory-500 mb-2">Accessibility Requirements</p>
                    <div className="flex flex-wrap gap-2">
                      {requirements.accessibility_requirements.map((r: string, i: number) => (
                        <span key={i} className="text-xs font-medium px-3 py-1 rounded-full bg-terracotta-100 text-terracotta-800 border border-terracotta-200">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
                {requirements.personal_notes && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ivory-500 mb-1">Personal Notes</p>
                    <p className="text-xs text-ivory-800 leading-relaxed p-3 rounded-lg bg-ivory-50 border border-ivory-200">{requirements.personal_notes}</p>
                  </div>
                )}
                {requirements.verified_checklist && Object.keys(requirements.verified_checklist).length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ivory-500 mb-2">Verified Checklist</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(requirements.verified_checklist).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-ivory-50 border border-ivory-200">
                          {v ? <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" /> : <Circle className="w-4 h-4 text-ivory-400 shrink-0" />}
                          <span className={v ? 'text-ivory-900' : 'text-ivory-500'}>{k.replace(/_/g, ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptySection message="No special requirements recorded yet." eventId={event.id} tab="requirements" />
            )}
          </section>

          {/* ── 6. What-if Planning ──────────────────────────────── */}
          <section className="p-6 sm:p-8 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm print:border-ivory-300">
            <SectionHeader stageId="what_if" completed={completedStages.has('what_if')} eventId={event.id} tab="what_if" />

            {(whatIf?.scenarios?.length > 0 || whatIf?.non_negotiables?.length > 0) ? (
              <div className="space-y-5">
                {(whatIf.scenarios || []).length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ivory-500 mb-2">Contingency Scenarios</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {whatIf.scenarios.map((s: any) => (
                        <div key={s.id} className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 space-y-1.5">
                          <p className="font-serif font-bold text-sm text-ivory-900">{s.title}</p>
                          <p className="text-xs text-ivory-700 font-light">{s.description}</p>
                          <div className="flex items-center justify-between pt-2 border-t border-ivory-200 text-xs">
                            <span className="font-semibold text-terracotta-700">+{formatINR(s.cost_impact)}</span>
                            <span className="text-teal-700 font-medium">{s.action_plan}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(whatIf.non_negotiables || []).length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ivory-500 mb-2">Non-Negotiables</p>
                    <div className="space-y-1.5">
                      {whatIf.non_negotiables.map((n: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs p-2.5 rounded-lg bg-ivory-50 border border-ivory-200 text-ivory-900">
                          <span className="w-2 h-2 rounded-full bg-marigold-500 shrink-0" /> {n}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {whatIf.contingency_fund > 0 && (
                  <p className="text-xs text-ivory-700">Contingency reserve: <span className="font-bold text-teal-800">{formatINR(whatIf.contingency_fund)}</span></p>
                )}
              </div>
            ) : (
              <EmptySection message="No what-if scenarios added yet." eventId={event.id} tab="what_if" />
            )}
          </section>

          {/* ── 7. Invitations & Finalisation ─────────────────────── */}
          <section className="p-6 sm:p-8 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm print:border-ivory-300">
            <SectionHeader stageId="invitations" completed={completedStages.has('invitations')} eventId={event.id} tab="invitations" />

            {invitations?.invitation_message ? (
              <div className="space-y-6">
                {/* Visual Invitation Card */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ivory-500 mb-3">Invitation Preview</p>
                  <InvitationCard event={event} invitations={invitations} palette={concept?.palette || []} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {invitations.invitation_message && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ivory-500">Formal Invitation</p>
                      <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 text-xs text-ivory-800 font-serif leading-relaxed whitespace-pre-wrap">
                        {invitations.invitation_message}
                      </div>
                    </div>
                  )}
                  {invitations.whatsapp_caption && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ivory-500">WhatsApp Broadcast</p>
                      <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 text-xs text-ivory-800 leading-relaxed whitespace-pre-wrap">
                        {invitations.whatsapp_caption}
                      </div>
                    </div>
                  )}
                </div>

                {invitations.dress_code && (
                  <p className="text-xs text-ivory-700">Dress code: <span className="font-semibold text-ivory-900">{invitations.dress_code}</span></p>
                )}
                {invitations.rsvp_deadline && (
                  <p className="text-xs text-ivory-700">RSVP by: <span className="font-semibold text-ivory-900">{invitations.rsvp_deadline}</span></p>
                )}
              </div>
            ) : (
              <EmptySection message="No invitation drafted yet." eventId={event.id} tab="invitations" />
            )}
          </section>

          {/* ── Footer ────────────────────────────────────────────── */}
          <div className="text-center text-xs text-ivory-500 pb-4 no-print">
            <p>Generated by <span className="font-semibold text-terracotta-600">Veloura</span> · Plan beautifully, celebrate effortlessly.</p>
          </div>
        </div>
      </div>
    </>
  );
};

// ── Visual Invitation Card Component ──────────────────────────────────────────

interface InvitationCardProps {
  event: Event;
  invitations: any;
  palette: Array<{ name: string; hex: string }>;
}

const InvitationCard: React.FC<InvitationCardProps> = ({ event, invitations, palette }) => {
  // Derive primary and accent colours from the saved palette
  const primary = palette[0]?.hex || '#C85A32';
  const accent  = palette[3]?.hex || '#E59500';
  const bg      = palette[1]?.hex || '#FDFBF7';

  const eventTypeLower = event.event_type.toLowerCase();
  const isWedding   = eventTypeLower.includes('wedding');
  const isBirthday  = eventTypeLower.includes('birthday');
  const isAnniversary = eventTypeLower.includes('anniversary');
  const isGala      = eventTypeLower.includes('gala');

  let decorativeTop = '✦ · ✦';
  let decorativeBottom = '✦ · ✦';
  if (isWedding)    { decorativeTop = '❧ ♡ ❧'; decorativeBottom = '~ Together forever ~'; }
  else if (isBirthday)  { decorativeTop = '✨ 🎉 ✨'; decorativeBottom = '~ Celebrate! ~'; }
  else if (isAnniversary) { decorativeTop = '♡ · ♡'; decorativeBottom = '~ Cheers to us ~'; }
  else if (isGala)  { decorativeTop = '✦ · ✦'; decorativeBottom = '~ A night to remember ~'; }

  return (
    <div
      className="relative mx-auto max-w-md rounded-2xl overflow-hidden shadow-warm-lg border"
      style={{ borderColor: primary, backgroundColor: bg }}
    >
      {/* Top ornament strip */}
      <div
        className="h-2.5 w-full"
        style={{ backgroundColor: primary }}
      />

      {/* Inner border frame */}
      <div
        className="m-4 rounded-xl border-2 p-6 sm:p-8 text-center space-y-5"
        style={{ borderColor: accent }}
      >
        {/* Decorative top */}
        <div className="text-lg tracking-widest" style={{ color: primary }}>
          {decorativeTop}
        </div>

        {/* Event type badge */}
        <div className="inline-block text-[11px] font-semibold uppercase tracking-[0.2em] px-4 py-1 rounded-full border" style={{ borderColor: accent, color: accent, backgroundColor: bg }}>
          {event.event_type}
        </div>

        {/* Title */}
        <h2
          className="font-serif text-2xl sm:text-3xl font-bold leading-tight"
          style={{ color: primary }}
        >
          {event.title}
        </h2>

        {/* Thin divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ backgroundColor: accent, opacity: 0.4 }} />
          <span className="text-xs tracking-widest" style={{ color: accent }}>◆</span>
          <div className="flex-1 h-px" style={{ backgroundColor: accent, opacity: 0.4 }} />
        </div>

        {/* Invitation message */}
        {invitations.invitation_message && (
          <p className="text-sm font-serif italic leading-relaxed text-ivory-800">
            {invitations.invitation_message}
          </p>
        )}

        {/* Details */}
        <div className="space-y-2 text-sm" style={{ color: primary }}>
          <div className="flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="font-semibold">{event.date}{event.time ? ` at ${event.time}` : ''}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{event.location}</span>
          </div>
          {event.guest_count && (
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              <span>{event.guest_count} guests</span>
            </div>
          )}
        </div>

        {/* Dress code & RSVP */}
        {(invitations.dress_code || invitations.rsvp_deadline) && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: accent, opacity: 0.4 }} />
              <span className="text-xs tracking-widest" style={{ color: accent }}>◆</span>
              <div className="flex-1 h-px" style={{ backgroundColor: accent, opacity: 0.4 }} />
            </div>
            <div className="text-xs space-y-1 text-ivory-700">
              {invitations.dress_code && <p>Dress Code: <span className="font-semibold">{invitations.dress_code}</span></p>}
              {invitations.rsvp_deadline && <p>RSVP by: <span className="font-semibold">{invitations.rsvp_deadline}</span></p>}
            </div>
          </>
        )}

        {/* Decorative bottom */}
        <div className="text-sm tracking-widest" style={{ color: accent }}>
          {decorativeBottom}
        </div>
      </div>

      {/* Bottom ornament strip */}
      <div
        className="h-2.5 w-full"
        style={{ backgroundColor: primary }}
      />
    </div>
  );
};
