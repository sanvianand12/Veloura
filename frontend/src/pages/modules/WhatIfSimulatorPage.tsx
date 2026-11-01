import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Event, WhatIfScenario } from '../../types';
import {
  SlidersHorizontal,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Plus,
  Trash2,
  CloudRain,
  Users,
  IndianRupee,
  TrendingDown,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';

function fmt(v: number) {
  return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

// Preset scenario templates
const PRESET_SCENARIOS = [
  {
    id: 'rain',
    title: 'Rain / Weather Backup',
    description: 'Move outdoor elements to covered marquee or indoor backup.',
    cost_impact_pct: 0.08,
    headcount_impact: 0,
    action_plan: 'Confirm marquee hold 48 hrs prior; brief hospitality team on indoor layout.',
    icon: CloudRain,
  },
  {
    id: 'headcount_surge',
    title: 'Headcount Surge (+20%)',
    description: 'Accommodate 20% more guests than originally planned.',
    cost_impact_pct: 0.20,
    headcount_impact: 0, // calculated dynamically
    action_plan: 'Caterer buffer clause allows +15% with 24hr notice; pre-book 3 extra tables.',
    icon: Users,
  },
  {
    id: 'catering_overrun',
    title: 'Catering Cost Increase (+15%)',
    description: 'Catering costs rise by 15% due to ingredient prices or last-minute additions.',
    cost_impact_pct: 0.05, // 15% of catering = ~5% of total
    headcount_impact: 0,
    action_plan: 'Reduce contingency reserve or trim entertainment budget to absorb increase.',
    icon: IndianRupee,
  },
  {
    id: 'budget_cut',
    title: 'Budget Reduction (−20%)',
    description: 'Total available budget drops by 20%. Identify compromises.',
    cost_impact_pct: -0.20,
    headcount_impact: 0,
    action_plan: 'Prioritise venue + catering. Reduce décor budget and photography to half-day.',
    icon: TrendingDown,
  },
];

export const WhatIfSimulatorPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scenarios, setScenarios] = useState<WhatIfScenario[]>([]);
  const [nonNeg, setNonNeg] = useState<string[]>([]);
  const [contingencyFund, setContingencyFund] = useState(0);
  const [notes, setNotes] = useState('');
  const [newNonNeg, setNewNonNeg] = useState('');
  const [activeScenario, setActiveScenario] = useState<WhatIfScenario | null>(null);

  useEffect(() => {
    apiService.getEvents().then((evs) => {
      setEvents(evs || []);
      if (evs?.length) setSelectedId(evs[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    Promise.all([apiService.getEvent(selectedId), apiService.getEventPlan(selectedId)])
      .then(([ev, plan]) => {
        const w = plan.what_if as any;
        setScenarios(w?.scenarios || []);
        setNonNeg(w?.non_negotiables || []);
        setContingencyFund(w?.contingency_fund || Math.round(ev.budget * 0.05));
        setNotes(w?.notes || '');
      })
      .catch((e) => setError(e?.message))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const activeEvent = events.find((e) => e.id === selectedId);

  const addPresetScenario = (preset: typeof PRESET_SCENARIOS[0]) => {
    if (!activeEvent) return;
    const costImpact = Math.abs(Math.round(activeEvent.budget * Math.abs(preset.cost_impact_pct)));
    const hcImpact   = preset.id === 'headcount_surge' ? Math.round(activeEvent.guest_count * 0.20) : 0;
    const scenario: WhatIfScenario = {
      id: `scen_${Date.now()}`,
      title: preset.title,
      description: preset.description,
      cost_impact: preset.cost_impact_pct < 0 ? -costImpact : costImpact,
      headcount_impact: hcImpact,
      action_plan: preset.action_plan,
    };
    setScenarios((prev) => {
      if (prev.some((s) => s.title === scenario.title)) return prev;
      return [...prev, scenario];
    });
    setActiveScenario(scenario);
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      await apiService.updateWhatIf(selectedId, {
        scenarios,
        non_negotiables: nonNeg,
        contingency_fund: contingencyFund,
        notes,
        mark_completed: true,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e?.message);
    } finally {
      setSaving(false);
    }
  };

  const totalCostImpact = scenarios.reduce((s, sc) => s + sc.cost_impact, 0);
  const simBudget       = activeEvent ? activeEvent.budget + totalCostImpact : 0;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-ivory-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-terracotta-600">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Smart Trade-Off Engine</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ivory-900 mt-1">
            What-if Scenario Simulator
          </h2>
          <p className="text-sm text-ivory-700 font-light mt-1">
            Simulate rain plans, guest surges and budget changes without affecting your saved plan.
          </p>
        </div>
      </div>

      {saved && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-teal-900 text-ivory-50 shadow-warm-lg border border-teal-700 flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-4 h-4 text-teal-300" /> Scenarios saved!
        </div>
      )}

      {/* Event selector */}
      <div className="p-4 rounded-2xl bg-ivory-100 border border-ivory-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase text-ivory-500 block">Event</span>
          <span className="font-serif font-bold text-ivory-900">{activeEvent?.title || '—'}</span>
          {activeEvent && <p className="text-xs text-ivory-600 mt-0.5">{activeEvent.guest_count} guests · {fmt(activeEvent.budget)}</p>}
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedId || ''} onChange={(e) => setSelectedId(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs font-medium text-ivory-900">
            {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
          </select>
          {activeEvent && (
            <button type="button" onClick={() => navigate(`/events/${activeEvent.id}/workspace`)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900">
              <ExternalLink className="w-3.5 h-3.5" /> Workspace
            </button>
          )}
        </div>
      </div>

      {loading && <div className="py-10 text-center"><RefreshCw className="w-6 h-6 animate-spin text-terracotta-500 mx-auto" /></div>}
      {error && <div className="p-4 rounded-xl bg-terracotta-50 border border-terracotta-200 text-xs text-terracotta-800 flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}

      {!loading && selectedId && activeEvent && (
        <>
          {/* Simulation summary */}
          {scenarios.length > 0 && (
            <div className={`p-5 rounded-2xl border ${totalCostImpact > 0 ? 'bg-terracotta-50 border-terracotta-200' : totalCostImpact < 0 ? 'bg-teal-50 border-teal-200' : 'bg-ivory-100 border-ivory-200'}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-ivory-600 mb-2">Simulation Summary</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[10px] text-ivory-500">Original Budget</p>
                  <p className="font-serif font-bold text-ivory-900">{fmt(activeEvent.budget)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-ivory-500">Scenario Impact</p>
                  <p className={`font-serif font-bold ${totalCostImpact > 0 ? 'text-terracotta-700' : 'text-teal-800'}`}>
                    {totalCostImpact >= 0 ? '+' : ''}{fmt(totalCostImpact)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-ivory-500">Revised Budget</p>
                  <p className="font-serif font-bold text-ivory-900">{fmt(simBudget)}</p>
                </div>
              </div>
              <p className="text-[11px] text-ivory-500 text-center mt-2">This is a simulation. Your saved plan is not changed until you click "Save".</p>
            </div>
          )}

          {/* Preset quick-add */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-ivory-900">Quick Scenario Templates</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESET_SCENARIOS.map((p) => {
                const Icon = p.icon;
                const alreadyAdded = scenarios.some((s) => s.title === p.title);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addPresetScenario(p)}
                    disabled={alreadyAdded}
                    className={`p-4 rounded-2xl border text-left transition-all ${alreadyAdded ? 'bg-ivory-200 border-ivory-300 opacity-60 cursor-default' : 'bg-ivory-100 border-ivory-200 hover:bg-ivory-200 hover:border-terracotta-300 shadow-warm-sm'}`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${alreadyAdded ? 'text-ivory-500' : 'text-terracotta-600'}`} />
                    <p className="text-xs font-semibold text-ivory-900">{p.title}</p>
                    <p className="text-[10px] text-ivory-500 mt-0.5">{alreadyAdded ? 'Added' : 'Click to add'}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active scenario detail */}
          {activeScenario && (
            <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200 shadow-warm-sm space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">Simulating:</p>
              <h4 className="font-serif font-bold text-lg text-ivory-900">{activeScenario.title}</h4>
              <p className="text-xs text-ivory-700">{activeScenario.description}</p>
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-teal-200 text-xs">
                <div><p className="text-[10px] text-ivory-500">Budget Impact</p><p className={`font-bold ${activeScenario.cost_impact >= 0 ? 'text-terracotta-700' : 'text-teal-800'}`}>{activeScenario.cost_impact >= 0 ? '+' : ''}{fmt(activeScenario.cost_impact)}</p></div>
                {activeScenario.headcount_impact !== 0 && <div><p className="text-[10px] text-ivory-500">Guest Change</p><p className="font-bold text-ivory-900">+{activeScenario.headcount_impact}</p></div>}
                <div><p className="text-[10px] text-ivory-500">Action Plan</p><p className="text-ivory-700">{activeScenario.action_plan}</p></div>
              </div>
            </div>
          )}

          {/* Scenarios list */}
          {scenarios.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-serif font-bold text-ivory-900">Active Scenarios ({scenarios.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {scenarios.map((s) => (
                  <div key={s.id} className={`p-5 rounded-2xl border shadow-warm-sm space-y-2 cursor-pointer transition-all ${activeScenario?.id === s.id ? 'border-teal-400 ring-2 ring-teal-200 bg-ivory-50' : 'bg-ivory-50 border-ivory-200 hover:border-ivory-300'}`}
                    onClick={() => setActiveScenario(s)}>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif font-bold text-sm text-ivory-900">{s.title}</h4>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setScenarios((prev) => prev.filter((x) => x.id !== s.id)); if (activeScenario?.id === s.id) setActiveScenario(null); }}
                        className="text-ivory-400 hover:text-terracotta-600 shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-ivory-600 font-light">{s.description}</p>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-ivory-200">
                      <span className={`font-bold ${s.cost_impact >= 0 ? 'text-terracotta-700' : 'text-teal-800'}`}>{s.cost_impact >= 0 ? '+' : ''}{fmt(s.cost_impact)}</span>
                      <span className="text-ivory-500">{s.action_plan}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Non-negotiables */}
          <div className="p-6 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-marigold-600" />
              <h3 className="font-serif font-bold text-ivory-900">Non-Negotiables</h3>
            </div>
            <p className="text-xs text-ivory-600 font-light">Elements that will never be compromised even in a contingency scenario.</p>
            <div className="space-y-2">
              {nonNeg.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-ivory-50 border border-ivory-200 text-xs text-ivory-900">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-marigold-500 shrink-0" />{item}</div>
                  <button type="button" onClick={() => setNonNeg(nonNeg.filter((_, j) => j !== i))} className="text-ivory-400 hover:text-terracotta-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input type="text" value={newNonNeg} onChange={(e) => setNewNonNeg(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newNonNeg.trim()) { setNonNeg([...nonNeg, newNonNeg.trim()]); setNewNonNeg(''); } }}
                placeholder="e.g. Live music during wedding ceremony"
                className="flex-1 px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ivory-900 focus:outline-none" />
              <button type="button" onClick={() => { if (newNonNeg.trim()) { setNonNeg([...nonNeg, newNonNeg.trim()]); setNewNonNeg(''); } }}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-marigold-600 text-ivory-50">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Contingency fund */}
          <div className="p-5 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-teal-700" />
              <h3 className="font-serif font-bold text-ivory-900">Contingency Reserve</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-ivory-600">₹</span>
              <input type="number" value={contingencyFund} onChange={(e) => setContingencyFund(Number(e.target.value) || 0)}
                className="w-48 px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-sm font-semibold text-ivory-900 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <span className="text-xs text-ivory-500">recommended: {activeEvent ? fmt(Math.round(activeEvent.budget * 0.08)) : '₹0'} (8% of budget)</span>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center justify-between pt-4 border-t border-ivory-200">
            <p className="text-xs text-ivory-600">Saving approves these scenarios as part of your contingency plan.</p>
            <button type="button" onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50 shadow-warm-sm transition-all">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Scenarios'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
