import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Event } from '../../types';
import {
  ShieldCheck,
  Save,
  CheckCircle2,
  Circle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Plus,
  Trash2,
  HeartHandshake,
  Eye,
  Volume2,
} from 'lucide-react';

const DIETARY_PRESETS = [
  'Vegetarian options', 'Vegan options', 'Jain vegetarian', '100% Jain (no root vegetables)',
  'Gluten-free counter', 'Nut-allergy protocol', 'Dairy-free options', 'Halal certified',
  'Kosher certified', 'No pork', 'No beef', 'Non-alcoholic bar option',
];

const ACCESS_PRESETS = [
  'Step-free venue entrance', 'Wheelchair accessible washroom', 'Ramp at stage/podium',
  'Reserved front-row seating for elders', 'Accessible parking spaces', 'Hearing loop / PA amplification',
  'High-contrast signage', 'Low-sensory quiet room', 'Braille menus on request',
];

const CHECKLIST_DEFAULTS: Record<string, string> = {
  step_free_access:         'Step-free venue entrance confirmed',
  dietary_labels_on_buffet: 'Dietary labels on all buffet dishes',
  first_aid_kit_on_site:    'First aid kit available on site',
  emergency_contact_sheet:  'Emergency contact sheet shared with staff',
  quiet_area_designated:    'Quiet relaxation area designated',
  child_supervision_plan:   'Child supervision plan in place',
  allergy_chef_briefing:    'Chef briefed on allergen protocols',
};

export const InclusiveCheckerPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dietary, setDietary] = useState<string[]>([]);
  const [access, setAccess] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [newDietary, setNewDietary] = useState('');
  const [newAccess, setNewAccess] = useState('');

  useEffect(() => {
    apiService.getEvents().then((evs) => {
      setEvents(evs || []);
      if (evs?.length) setSelectedId(evs[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    apiService.getEventPlan(selectedId)
      .then((plan) => {
        const r = plan.requirements as any;
        setDietary(r?.dietary_requirements || []);
        setAccess(r?.accessibility_requirements || []);
        setNotes(r?.personal_notes || '');
        setChecklist(r?.verified_checklist || Object.fromEntries(Object.keys(CHECKLIST_DEFAULTS).map((k) => [k, false])));
      })
      .catch((e) => setError(e?.message))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const activeEvent = events.find((e) => e.id === selectedId);

  const togglePreset = (arr: string[], val: string, setter: (a: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const addCustom = (val: string, arr: string[], setter: (a: string[]) => void, clear: () => void) => {
    if (!val.trim() || arr.includes(val.trim())) return;
    setter([...arr, val.trim()]);
    clear();
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      await apiService.updateRequirements(selectedId, {
        dietary_requirements: dietary,
        accessibility_requirements: access,
        personal_notes: notes,
        verified_checklist: checklist,
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

  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const totalChecks  = Object.keys(checklist).length || Object.keys(CHECKLIST_DEFAULTS).length;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-ivory-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Inclusive Event Checker</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ivory-900 mt-1">
            Dietary, Accessibility & Inclusion
          </h2>
          <p className="text-sm text-ivory-700 font-light mt-1">
            Ensure every guest experiences dignified, comfortable hospitality.
          </p>
        </div>
      </div>

      {saved && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-teal-900 text-ivory-50 shadow-warm-lg border border-teal-700 flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-4 h-4 text-teal-300" /> Requirements saved!
        </div>
      )}

      {/* Event selector */}
      <div className="p-4 rounded-2xl bg-ivory-100 border border-ivory-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase text-ivory-500 block">Event</span>
          <span className="font-serif font-bold text-ivory-900">{activeEvent?.title || '—'}</span>
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

      {!loading && selectedId && (
        <>
          {/* Dietary */}
          <div className="p-6 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm space-y-4">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-teal-700" />
              <h3 className="font-serif font-bold text-ivory-900">Dietary Requirements</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {DIETARY_PRESETS.map((p) => (
                <button key={p} type="button" onClick={() => togglePreset(dietary, p, setDietary)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${dietary.includes(p) ? 'bg-teal-800 text-ivory-50 border-teal-800' : 'bg-ivory-50 text-ivory-800 border-ivory-300 hover:bg-ivory-200'}`}>
                  {dietary.includes(p) ? '✓ ' : '+ '}{p}
                </button>
              ))}
            </div>
            {dietary.filter((d) => !DIETARY_PRESETS.includes(d)).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {dietary.filter((d) => !DIETARY_PRESETS.includes(d)).map((d, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-800 text-ivory-50">
                    {d}
                    <button type="button" onClick={() => setDietary(dietary.filter((x) => x !== d))}>×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="text" value={newDietary} onChange={(e) => setNewDietary(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustom(newDietary, dietary, setDietary, () => setNewDietary(''))}
                placeholder="Add custom dietary need…"
                className="flex-1 px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ivory-900 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <button type="button" onClick={() => addCustom(newDietary, dietary, setDietary, () => setNewDietary(''))}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-teal-800 text-ivory-50">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Accessibility */}
          <div className="p-6 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-terracotta-600" />
              <h3 className="font-serif font-bold text-ivory-900">Accessibility & Mobility</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {ACCESS_PRESETS.map((p) => (
                <button key={p} type="button" onClick={() => togglePreset(access, p, setAccess)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${access.includes(p) ? 'bg-terracotta-700 text-ivory-50 border-terracotta-700' : 'bg-ivory-50 text-ivory-800 border-ivory-300 hover:bg-ivory-200'}`}>
                  {access.includes(p) ? '✓ ' : '+ '}{p}
                </button>
              ))}
            </div>
            {access.filter((a) => !ACCESS_PRESETS.includes(a)).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {access.filter((a) => !ACCESS_PRESETS.includes(a)).map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-terracotta-700 text-ivory-50">
                    {a}
                    <button type="button" onClick={() => setAccess(access.filter((x) => x !== a))}>×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="text" value={newAccess} onChange={(e) => setNewAccess(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustom(newAccess, access, setAccess, () => setNewAccess(''))}
                placeholder="Add custom accessibility need…"
                className="flex-1 px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ivory-900 focus:outline-none" />
              <button type="button" onClick={() => addCustom(newAccess, access, setAccess, () => setNewAccess(''))}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-terracotta-700 text-ivory-50">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Personal notes */}
          <div className="p-6 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm space-y-3">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-marigold-600" />
              <h3 className="font-serif font-bold text-ivory-900">Cultural & Personal Notes</h3>
            </div>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. Prayer time accommodation, ceremony customs, elder seating preferences, child play area…"
              className="w-full px-4 py-3 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ivory-900 focus:outline-none focus:ring-2 focus:ring-marigold-500"
            />
          </div>

          {/* Verification checklist */}
          <div className="p-6 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <h3 className="font-serif font-bold text-ivory-900">Venue & Vendor Verification</h3>
              </div>
              <span className="text-xs font-semibold text-teal-800">{checkedCount}/{totalChecks} verified</span>
            </div>
            <p className="text-xs text-ivory-600 font-light">Tick items only once you have confirmed them with your venue or vendors. Do not tick unverified items.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries({ ...CHECKLIST_DEFAULTS, ...checklist }).map(([key]) => {
                const isChecked = checklist[key] || false;
                const label     = CHECKLIST_DEFAULTS[key] || key.replace(/_/g, ' ');
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setChecklist({ ...checklist, [key]: !isChecked })}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs transition-all ${isChecked ? 'bg-teal-50 border-teal-300 text-teal-900' : 'bg-ivory-50 border-ivory-200 text-ivory-700 hover:bg-ivory-100'}`}
                  >
                    {isChecked
                      ? <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                      : <Circle className="w-4 h-4 text-ivory-400 shrink-0" />}
                    <span className={isChecked ? 'font-semibold' : ''}>{label}</span>
                  </button>
                );
              })}
            </div>
            {checkedCount < totalChecks && (
              <div className="p-3 rounded-xl bg-marigold-50 border border-marigold-200 text-xs text-marigold-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{totalChecks - checkedCount} item{totalChecks - checkedCount > 1 ? 's' : ''} not yet verified. Please confirm with your venue and vendors before the event.</span>
              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex items-center justify-between pt-4 border-t border-ivory-200">
            <p className="text-xs text-ivory-600">Saved per event. Visible in your Master Plan.</p>
            <button type="button" onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-teal-800 hover:bg-teal-900 text-ivory-50 shadow-warm-sm transition-all">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Requirements'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
