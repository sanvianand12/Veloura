import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Event, BudgetCategory, BudgetExpense } from '../../types';
import {
  WalletCards,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';

function fmt(v: number) {
  return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

const CHART_COLORS = ['#C85A32', '#E76F51', '#26796E', '#E59500', '#B04723', '#529F92', '#685F53'];

const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { id: 'venue',         name: 'Venue & Décor',             allocated: 0, spent: 0 },
  { id: 'catering',      name: 'Catering & Beverages',       allocated: 0, spent: 0 },
  { id: 'photography',   name: 'Photography & Video',        allocated: 0, spent: 0 },
  { id: 'entertainment', name: 'Music & Entertainment',      allocated: 0, spent: 0 },
  { id: 'logistics',     name: 'Logistics & Transport',      allocated: 0, spent: 0 },
  { id: 'misc',          name: 'Miscellaneous',              allocated: 0, spent: 0 },
  { id: 'contingency',   name: 'Contingency Reserve',        allocated: 0, spent: 0 },
];

export const BudgetPlannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [totalBudget, setTotalBudget] = useState(0);
  const [categories, setCategories] = useState<BudgetCategory[]>(DEFAULT_CATEGORIES);
  const [expenses, setExpenses] = useState<BudgetExpense[]>([]);

  const [newExp, setNewExp] = useState({ title: '', category_id: 'venue', amount: '', vendor: '' });

  useEffect(() => {
    apiService.getEvents().then((evs) => {
      setEvents(evs || []);
      if (evs?.length) setSelectedId(evs[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const ev = events.find((event) => event.id === selectedId);
    if (!ev) return;
    setLoading(true);
    apiService.getEventPlan(selectedId).then((plan) => {
      const b = plan.budget as any;
      setTotalBudget(b?.total_budget || ev.budget || 0);
      if ((b?.categories || []).length > 0) {
        setCategories(b.categories);
      } else {
        // Auto-allocate from event budget
        const tb = ev.budget || 0;
        setCategories([
          { id: 'venue',         name: 'Venue & Décor',           allocated: Math.round(tb * 0.30), spent: 0 },
          { id: 'catering',      name: 'Catering & Beverages',     allocated: Math.round(tb * 0.35), spent: 0 },
          { id: 'photography',   name: 'Photography & Video',      allocated: Math.round(tb * 0.10), spent: 0 },
          { id: 'entertainment', name: 'Music & Entertainment',    allocated: Math.round(tb * 0.05), spent: 0 },
          { id: 'logistics',     name: 'Logistics & Transport',    allocated: Math.round(tb * 0.05), spent: 0 },
          { id: 'misc',          name: 'Miscellaneous',            allocated: Math.round(tb * 0.10), spent: 0 },
          { id: 'contingency',   name: 'Contingency Reserve',      allocated: Math.round(tb * 0.05), spent: 0 },
        ]);
      }
      setExpenses(b?.expenses || []);
    }).catch((e) => setError(e?.message))
    .finally(() => setLoading(false));
  }, [selectedId, events]);

  const activeEvent = events.find((e) => e.id === selectedId);

  const totalAllocated = categories.reduce((s, c) => s + (c.allocated || 0), 0);
  const totalSpent     = categories.reduce((s, c) => s + (c.spent || 0), 0);
  const remaining      = Math.max(0, totalBudget - totalSpent);
  const perGuest       = activeEvent && totalSpent > 0 && activeEvent.guest_count > 0
    ? Math.round(totalSpent / activeEvent.guest_count) : 0;
  const overBudget     = totalSpent > totalBudget;

  const handleCatChange = (id: string, field: 'allocated' | 'spent', val: string) => {
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, [field]: Number(val) || 0 } : c));
  };

  const handleAddExpense = () => {
    if (!newExp.title.trim() || !newExp.amount) return;
    const amt = parseFloat(newExp.amount);
    if (isNaN(amt) || amt <= 0) return;
    const exp: BudgetExpense = {
      id: `exp_${Date.now()}`,
      category_id: newExp.category_id,
      title: newExp.title.trim(),
      amount: amt,
      date: new Date().toISOString().split('T')[0],
      vendor: newExp.vendor.trim() || undefined,
    };
    // Update spent in category
    setCategories((prev) => prev.map((c) => c.id === newExp.category_id ? { ...c, spent: (c.spent || 0) + amt } : c));
    setExpenses((prev) => [exp, ...prev]);
    setNewExp({ title: '', category_id: 'venue', amount: '', vendor: '' });
  };

  const handleDeleteExpense = (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    if (exp) {
      setCategories((prev) => prev.map((c) => c.id === exp.category_id ? { ...c, spent: Math.max(0, (c.spent || 0) - exp.amount) } : c));
    }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      await apiService.updateBudget(selectedId, {
        total_budget: totalBudget,
        currency: 'INR',
        categories,
        expenses,
        mark_completed: true,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const chartData = categories.filter((c) => c.allocated > 0).map((c) => ({
    name: c.name.split(' ').slice(0, 2).join(' '),
    allocated: c.allocated,
    spent: c.spent || 0,
  }));

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-ivory-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-marigold-600">
            <WalletCards className="w-3.5 h-3.5" />
            <span>RupeeWise Budget Planner</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ivory-900 mt-1">
            Budget Planner
          </h2>
          <p className="text-sm text-ivory-700 font-light mt-1">
            Allocate, track expenses and stay in control — all in ₹ INR.
          </p>
        </div>
      </div>

      {saved && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-teal-900 text-ivory-50 shadow-warm-lg border border-teal-700 flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-4 h-4 text-teal-300" />
          Budget saved!
        </div>
      )}

      {/* Event selector */}
      <div className="p-4 rounded-2xl bg-ivory-100 border border-ivory-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase text-ivory-500 block">Event</span>
          <span className="font-serif font-bold text-ivory-900">{activeEvent?.title || 'Select an event'}</span>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedId || ''}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs font-medium text-ivory-900"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
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

      {error && (
        <div className="p-4 rounded-xl bg-terracotta-50 border border-terracotta-200 text-xs text-terracotta-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}
        </div>
      )}

      {!loading && selectedId && (
        <>
          {/* Total budget input */}
          <div className="p-5 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-700 mb-2">Total Event Budget (₹ INR)</label>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-ivory-600">₹</span>
              <input
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(Number(e.target.value) || 0)}
                className="w-60 px-4 py-2.5 rounded-xl bg-ivory-50 border border-ivory-300 text-sm font-semibold text-ivory-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
              />
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Budget',   val: fmt(totalBudget),   sub: 'Your ceiling',                color: 'text-ivory-900'     },
              { label: 'Allocated',      val: fmt(totalAllocated), sub: `${totalBudget > 0 ? Math.round((totalAllocated/totalBudget)*100) : 0}% of budget`, color: 'text-terracotta-700' },
              { label: 'Spent',          val: fmt(totalSpent),    sub: overBudget ? '⚠ Over budget!' : `${totalBudget > 0 ? Math.round((totalSpent/totalBudget)*100) : 0}% used`, color: overBudget ? 'text-terracotta-700' : 'text-ivory-900' },
              { label: 'Remaining',      val: fmt(remaining),     sub: perGuest > 0 ? `₹${perGuest.toLocaleString('en-IN')}/guest spent` : 'Available', color: 'text-teal-800' },
            ].map(({ label, val, sub, color }) => (
              <div key={label} className="p-4 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ivory-500 mb-1">{label}</p>
                <p className={`font-serif text-xl font-bold ${color}`}>{val}</p>
                <p className="text-[11px] text-ivory-600 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm">
                <h4 className="font-serif font-bold text-ivory-900 mb-3 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-terracotta-600" /> Allocation Distribution
                </h4>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} dataKey="allocated" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                        {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => [fmt(Number(v)), 'Allocated']} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E8DFC9' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {chartData.slice(0, 5).map((c, i) => (
                    <div key={c.name} className="flex items-center gap-1.5 text-[11px] text-ivory-700">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {c.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm">
                <h4 className="font-serif font-bold text-ivory-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-700" /> Allocated vs Spent
                </h4>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 20, left: 0 }}>
                      <XAxis dataKey="name" stroke="#685F53" fontSize={9} tickLine={false} axisLine={{ stroke: '#E8DFC9' }} angle={-20} textAnchor="end" />
                      <YAxis stroke="#685F53" fontSize={9} tickLine={false} axisLine={{ stroke: '#E8DFC9' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any, name: string) => [fmt(Number(v)), name === 'allocated' ? 'Allocated' : 'Spent']} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E8DFC9' }} />
                      <Bar dataKey="allocated" fill="#C85A32" radius={[4, 4, 0, 0]} opacity={0.7} />
                      <Bar dataKey="spent"     fill="#26796E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Category allocations */}
          <div className="space-y-3">
            <h3 className="font-serif text-lg font-bold text-ivory-900">Category Allocations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat, i) => {
                const pct = cat.allocated > 0 ? Math.min(100, ((cat.spent || 0) / cat.allocated) * 100) : 0;
                const over = (cat.spent || 0) > cat.allocated;
                return (
                  <div key={cat.id} className={`p-4 rounded-2xl border ${over ? 'bg-terracotta-50 border-terracotta-200' : 'bg-ivory-50 border-ivory-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-ivory-900">{cat.name}</span>
                      {over && <span className="text-[10px] font-bold text-terracotta-700">Over budget!</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="text-[10px] text-ivory-500 block">Allocated ₹</label>
                        <input
                          type="number"
                          value={cat.allocated}
                          onChange={(e) => handleCatChange(cat.id, 'allocated', e.target.value)}
                          className="w-full px-2 py-1 rounded-lg bg-ivory-100 border border-ivory-300 text-xs font-mono text-ivory-900 focus:outline-none focus:ring-1 focus:ring-terracotta-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-ivory-500 block">Spent ₹</label>
                        <input
                          type="number"
                          value={cat.spent || 0}
                          onChange={(e) => handleCatChange(cat.id, 'spent', e.target.value)}
                          className="w-full px-2 py-1 rounded-lg bg-ivory-100 border border-ivory-300 text-xs font-mono text-ivory-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-ivory-200 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${over ? 'bg-terracotta-600' : 'bg-teal-600'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-ivory-500 mt-1">
                      <span>Left: {fmt(Math.max(0, cat.allocated - (cat.spent || 0)))}</span>
                      <span>{Math.round(pct)}% used</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expense logger */}
          <div className="space-y-3">
            <h3 className="font-serif text-lg font-bold text-ivory-900">Log an Expense</h3>
            <div className="p-4 rounded-2xl bg-ivory-100 border border-ivory-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Description (e.g. Venue deposit)"
                  value={newExp.title}
                  onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ivory-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                />
                <select
                  value={newExp.category_id}
                  onChange={(e) => setNewExp({ ...newExp, category_id: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ivory-900"
                >
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={newExp.amount}
                  onChange={(e) => setNewExp({ ...newExp, amount: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ivory-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddExpense}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50 flex items-center gap-1.5 justify-center"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              <input
                type="text"
                placeholder="Vendor name (optional)"
                value={newExp.vendor}
                onChange={(e) => setNewExp({ ...newExp, vendor: e.target.value })}
                className="w-full sm:w-64 px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ivory-900 focus:outline-none"
              />
            </div>

            {expenses.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-serif font-bold text-sm text-ivory-900">Expenses ({expenses.length})</h4>
                {expenses.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between p-3 rounded-xl bg-ivory-50 border border-ivory-200 text-xs">
                    <div>
                      <span className="font-semibold text-ivory-900">{exp.title}</span>
                      {exp.vendor && <span className="text-ivory-500 ml-2">· {exp.vendor}</span>}
                      <span className="text-ivory-400 ml-2">({categories.find((c) => c.id === exp.category_id)?.name || exp.category_id})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-terracotta-700">{fmt(exp.amount)}</span>
                      <button type="button" onClick={() => handleDeleteExpense(exp.id)} className="text-ivory-400 hover:text-terracotta-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex items-center justify-between pt-4 border-t border-ivory-200">
            <p className="text-xs text-ivory-600">Budget is saved per event and persists after refresh.</p>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50 shadow-warm-sm transition-all"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Budget'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
