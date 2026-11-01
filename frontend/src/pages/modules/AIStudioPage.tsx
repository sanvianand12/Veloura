import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Event } from '../../types';
import {
  Sparkles,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Palette,
  Lightbulb,
  Music,
  Utensils,
  IndianRupee,
  ExternalLink,
} from 'lucide-react';

const STYLES = [
  'Elegant & Timeless', 'Minimalist Modern', 'Traditional Indian',
  'Royal Luxury', 'Bohemian Garden', 'Rustic Countryside',
  'Floral Dreamy', 'Contemporary Chic', 'Festive & Vibrant', 'Intimate & Cosy',
];
const COLOUR_PREFS = [
  'Warm Terracotta', 'Ivory & Gold', 'Deep Teal & Emerald', 'Blush Pink & Rose',
  'Royal Maroon & Gold', 'Sage Green & White', 'Midnight Navy & Silver', 'Marigold & Saffron',
];
const DECOR_PREFS = [
  'Floral & Botanical', 'Candles & Fairy Lights', 'Draping & Fabric', 'Geometric & Modern',
  'Traditional Motifs', 'Minimal & Clean', 'Rustic Wood & Linen', 'Luxe Metallic Accents',
];

interface GeneratedConcept {
  theme: string;
  tagline: string;
  visual_direction: string;
  palette: Array<{ name: string; hex: string }>;
  entrance_decor: string[];
  table_decor: string[];
  lighting: string[];
  florals: string[];
  menu: string[];
  entertainment: string[];
  cost_estimate: string;
  practical_tips: string[];
  is_demo: boolean;
}

export const AIStudioPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preferences
  const [style, setStyle] = useState('Elegant & Timeless');
  const [colourPref, setColourPref] = useState<string[]>([]);
  const [decorPref, setDecorPref] = useState<string[]>([]);
  const [indoor, setIndoor] = useState<'Indoor' | 'Outdoor' | 'Both'>('Indoor');
  const [cultural, setCultural] = useState('');
  const [extra, setExtra] = useState('');

  // Generated concept
  const [concept, setConcept] = useState<GeneratedConcept | null>(null);
  const [savedConcept, setSavedConcept] = useState<GeneratedConcept | null>(null);

  useEffect(() => {
    apiService.getEvents().then((evs) => {
      setEvents(evs || []);
      if (evs?.length) setSelectedEventId(evs[0].id);
    });
  }, []);

  // Load existing saved concept when event changes
  useEffect(() => {
    if (!selectedEventId) return;
    apiService.getEventPlan(selectedEventId).then((plan) => {
      const c = plan.concept as any;
      if (c?.theme && c?.is_custom) {
        const loaded: GeneratedConcept = {
          theme: c.theme,
          tagline: c.tagline || '',
          visual_direction: c.notes || '',
          palette: c.palette || [],
          entrance_decor: c.decor_ideas?.slice(0, 2) || [],
          table_decor: c.decor_ideas?.slice(2, 4) || [],
          lighting: [],
          florals: [],
          menu: c.menu_suggestions || [],
          entertainment: c.entertainment_concepts || [],
          cost_estimate: '',
          practical_tips: [],
          is_demo: c.is_demo ?? false,
        };
        setSavedConcept(loaded);
        setConcept(loaded);
      }
    }).catch(() => {});
  }, [selectedEventId]);

  const activeEvent = events.find((e) => e.id === selectedEventId);

  const toggle = (arr: string[], val: string, setter: (a: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const handleGenerate = async () => {
    if (!activeEvent) return;
    setLoading(true);
    setError(null);
    setConcept(null);
    try {
      // Call the backend concept/generate endpoint
      const raw = await apiService.generateConcept(activeEvent.id);

      // Augment with preference context (backend may not know all prefs)
      const generated: GeneratedConcept = {
        theme:            raw.theme || `${style} ${activeEvent.event_type}`,
        tagline:          raw.tagline || `A beautiful ${activeEvent.event_type.toLowerCase()} in ${activeEvent.location}`,
        visual_direction: raw.notes || `Inspired by ${style.toLowerCase()} aesthetics with ${colourPref.join(', ') || 'warm neutral'} tones.`,
        palette:          raw.palette || [],
        entrance_decor:   (raw.decor_ideas || []).slice(0, 2),
        table_decor:      (raw.decor_ideas || []).slice(2, 4),
        lighting:         [],
        florals:          [],
        menu:             raw.menu_suggestions || [],
        entertainment:    raw.entertainment_concepts || [],
        cost_estimate:    estimateCost(activeEvent.budget, activeEvent.guest_count),
        practical_tips:   buildTips(activeEvent, style),
        is_demo:          !raw.is_custom,
      };
      setConcept(generated);
    } catch {
      // Graceful demo fallback
      setConcept(buildDemoConcept(activeEvent, style, colourPref, decorPref));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!concept || !selectedEventId) return;
    setSaving(true);
    try {
      await apiService.updateConcept(selectedEventId, {
        theme:                   concept.theme,
        tagline:                 concept.tagline,
        palette:                 concept.palette,
        decor_ideas:             [...(concept.entrance_decor || []), ...(concept.table_decor || []), ...(concept.florals || [])],
        menu_suggestions:        concept.menu,
        entertainment_concepts:  concept.entertainment,
        notes:                   concept.visual_direction,
        is_demo:                 concept.is_demo,
        is_custom:               true,
        mark_completed:          true,
      });
      setSavedConcept(concept);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-ivory-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-terracotta-600">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Event Studio</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ivory-900 mt-1">
            Generate Your Event Concept
          </h2>
          <p className="text-sm text-ivory-700 font-light mt-1">
            Describe your vision and Veloura will generate a personalised theme, palette, décor, menu and more.
          </p>
        </div>
        {activeEvent && (
          <button
            type="button"
            onClick={() => navigate(`/events/${activeEvent.id}/workspace`)}
            className="no-print inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Workspace
          </button>
        )}
      </div>

      {savedOk && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-teal-900 text-ivory-50 shadow-warm-lg border border-teal-700 flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-4 h-4 text-teal-300" />
          Concept saved to your event!
        </div>
      )}

      {/* ── A. Event Context ─────────────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm">
        <h3 className="font-serif text-base font-bold text-ivory-900 mb-4">A. Select Your Event</h3>
        {events.length === 0 ? (
          <p className="text-sm text-ivory-600">No events yet. <a href="/dashboard/create" className="text-terracotta-600 font-semibold hover:underline">Create one first</a>.</p>
        ) : (
          <>
            <select
              value={selectedEventId || ''}
              onChange={(e) => setSelectedEventId(Number(e.target.value))}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-ivory-50 border border-ivory-300 text-sm font-medium text-ivory-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title} — {ev.event_type}</option>
              ))}
            </select>

            {activeEvent && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Type',     value: activeEvent.event_type },
                  { label: 'Location', value: activeEvent.location },
                  { label: 'Guests',   value: `${activeEvent.guest_count}` },
                  { label: 'Budget',   value: `₹${activeEvent.budget.toLocaleString('en-IN')}` },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 text-xs">
                    <span className="text-ivory-500 block text-[10px] uppercase font-semibold">{label}</span>
                    <span className="font-semibold text-ivory-900 mt-0.5 block truncate">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── B. Theme Preferences ─────────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm space-y-5">
        <h3 className="font-serif text-base font-bold text-ivory-900">B. Your Preferences</h3>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-700">Event Style</label>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStyle(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  style === s
                    ? 'bg-terracotta-600 text-ivory-50 border-terracotta-600'
                    : 'bg-ivory-50 text-ivory-800 border-ivory-300 hover:bg-ivory-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-700">Colour Mood (pick up to 3)</label>
          <div className="flex flex-wrap gap-2">
            {COLOUR_PREFS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggle(colourPref, c, setColourPref)}
                disabled={!colourPref.includes(c) && colourPref.length >= 3}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  colourPref.includes(c)
                    ? 'bg-teal-800 text-ivory-50 border-teal-800'
                    : 'bg-ivory-50 text-ivory-800 border-ivory-300 hover:bg-ivory-200 disabled:opacity-40'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-700">Décor Style</label>
          <div className="flex flex-wrap gap-2">
            {DECOR_PREFS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggle(decorPref, d, setDecorPref)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  decorPref.includes(d)
                    ? 'bg-marigold-600 text-ivory-50 border-marigold-600'
                    : 'bg-ivory-50 text-ivory-800 border-ivory-300 hover:bg-ivory-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-700">Venue Type</label>
            <div className="flex gap-2">
              {(['Indoor', 'Outdoor', 'Both'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setIndoor(v)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    indoor === v ? 'bg-coral-500 text-ivory-50 border-coral-500' : 'bg-ivory-50 text-ivory-800 border-ivory-300 hover:bg-ivory-200'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-700">Cultural / Personal Preferences</label>
            <input
              type="text"
              value={cultural}
              onChange={(e) => setCultural(e.target.value)}
              placeholder="e.g. South Indian, Punjabi, Maharashtrian…"
              className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ivory-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-700">Additional Instructions</label>
            <input
              type="text"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="Any specific wishes or constraints…"
              className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ivory-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
            />
          </div>
        </div>
      </div>

      {/* ── Generate Button ──────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !selectedEventId}
          className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm font-bold bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50 shadow-warm transition-all disabled:opacity-50"
        >
          <Sparkles className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Generating…' : 'Generate My Event Concept'}</span>
        </button>
        {concept && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ivory-600 hover:text-terracotta-600 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-terracotta-50 border border-terracotta-200 flex items-start gap-3 text-xs text-terracotta-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ── C. Generated Results ─────────────────────────────────── */}
      {concept && (
        <div className="space-y-6">
          {/* Demo label */}
          {concept.is_demo && (
            <div className="px-4 py-2.5 rounded-xl bg-marigold-50 border border-marigold-200 text-xs text-marigold-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span><strong>Sample concept:</strong> No Gemini API key is configured. This is a curated demo result, not a live AI generation.</span>
            </div>
          )}

          {/* Theme card */}
          <div className="p-6 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ivory-500 mb-1">Event Theme</p>
                <h3 className="font-serif text-2xl font-bold text-ivory-900">{concept.theme}</h3>
                {concept.tagline && <p className="text-sm text-ivory-600 italic mt-1">"{concept.tagline}"</p>}
                {concept.visual_direction && <p className="text-xs text-ivory-700 mt-2 leading-relaxed max-w-2xl">{concept.visual_direction}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-800 hover:bg-teal-900 text-ivory-50 shadow-warm-sm transition-all"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving…' : 'Save to Event'}
                </button>
              </div>
            </div>
          </div>

          {/* Colour Palette */}
          {concept.palette.length > 0 && (
            <div className="p-6 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-4 h-4 text-terracotta-600" />
                <h4 className="font-serif font-bold text-ivory-900">Colour Palette</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {concept.palette.map((c, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-ivory-200 shadow-warm-sm">
                    <div className="h-16 w-full" style={{ backgroundColor: c.hex }} />
                    <div className="p-2 bg-ivory-50">
                      <p className="text-[11px] font-semibold text-ivory-900 truncate">{c.name}</p>
                      <p className="text-[10px] font-mono text-ivory-500 uppercase">{c.hex}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Décor sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {concept.entrance_decor.length > 0 && (
              <ConceptSection title="Stage & Entrance Décor" icon={Palette} colour="terracotta" items={concept.entrance_decor} />
            )}
            {concept.table_decor.length > 0 && (
              <ConceptSection title="Table & Seating Décor" icon={Lightbulb} colour="teal" items={concept.table_decor} />
            )}
          </div>

          {/* Menu */}
          {concept.menu.length > 0 && (
            <div className="p-6 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm">
              <div className="flex items-center gap-2 mb-4">
                <Utensils className="w-4 h-4 text-teal-700" />
                <h4 className="font-serif font-bold text-ivory-900">Menu & Culinary Direction</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {concept.menu.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-ivory-50 border border-ivory-200 text-xs text-ivory-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Entertainment */}
          {concept.entertainment.length > 0 && (
            <div className="p-6 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm">
              <div className="flex items-center gap-2 mb-4">
                <Music className="w-4 h-4 text-marigold-600" />
                <h4 className="font-serif font-bold text-ivory-900">Entertainment & Experience</h4>
              </div>
              <div className="space-y-2">
                {concept.entertainment.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-ivory-50 border border-ivory-200 text-xs text-ivory-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-marigold-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost + Tips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {concept.cost_estimate && (
              <div className="p-5 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm">
                <div className="flex items-center gap-2 mb-3">
                  <IndianRupee className="w-4 h-4 text-terracotta-600" />
                  <h4 className="font-serif font-bold text-ivory-900">Estimated Cost Range</h4>
                </div>
                <p className="text-sm text-ivory-800 leading-relaxed">{concept.cost_estimate}</p>
                <p className="text-[11px] text-ivory-500 mt-2">Indicative only — actual costs depend on vendor quotes and city.</p>
              </div>
            )}
            {concept.practical_tips.length > 0 && (
              <div className="p-5 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-marigold-600" />
                  <h4 className="font-serif font-bold text-ivory-900">Practical Recommendations</h4>
                </div>
                <div className="space-y-1.5">
                  {concept.practical_tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-ivory-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-marigold-500 mt-1 shrink-0" />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Save CTA */}
          <div className="flex items-center justify-between p-5 rounded-2xl bg-teal-900/10 border border-teal-200">
            <div>
              <p className="text-sm font-semibold text-ivory-900">Happy with this concept?</p>
              <p className="text-xs text-ivory-600 mt-0.5">Save it to your event and continue planning in the workspace.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-800 hover:bg-teal-900 text-ivory-50 shadow-warm-sm transition-all"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save Concept'}
              </button>
              {savedConcept && activeEvent && (
                <a
                  href={`/events/${activeEvent.id}/workspace`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Workspace
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {!concept && !loading && selectedEventId && (
        <div className="p-10 text-center rounded-2xl bg-ivory-100 border-2 border-dashed border-ivory-300 space-y-3">
          <Sparkles className="w-10 h-10 text-terracotta-400 mx-auto" />
          <p className="font-serif text-lg font-bold text-ivory-900">Ready to generate your concept</p>
          <p className="text-xs text-ivory-600">Set your preferences above and click "Generate My Event Concept".</p>
        </div>
      )}
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

interface ConceptSectionProps {
  title: string;
  icon: React.FC<any>;
  colour: 'terracotta' | 'teal' | 'marigold';
  items: string[];
}

const ConceptSection: React.FC<ConceptSectionProps> = ({ title, icon: Icon, colour, items }) => {
  const dot: Record<string, string> = {
    terracotta: 'bg-terracotta-500',
    teal: 'bg-teal-600',
    marigold: 'bg-marigold-500',
  };
  const iconCol: Record<string, string> = {
    terracotta: 'text-terracotta-600',
    teal: 'text-teal-700',
    marigold: 'text-marigold-600',
  };
  return (
    <div className="p-5 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm">
      <div className={`flex items-center gap-2 mb-3 ${iconCol[colour]}`}>
        <Icon className="w-4 h-4" />
        <h4 className="font-serif font-bold text-ivory-900">{title}</h4>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-ivory-800 p-2.5 rounded-lg bg-ivory-50 border border-ivory-200">
            <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${dot[colour]}`} />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Helper functions ──────────────────────────────────────────────────────────

function estimateCost(budget: number, guests: number): string {
  const perGuest = budget > 0 && guests > 0 ? Math.round(budget / guests) : 0;
  if (budget >= 1000000) {
    return `For a budget of ₹${budget.toLocaleString('en-IN')}, expect ₹${perGuest.toLocaleString('en-IN')} per guest. Premium venues in this range include luxury hotels and heritage properties. Catering with a multi-course menu typically runs ₹${Math.round(perGuest * 0.35).toLocaleString('en-IN')}–₹${Math.round(perGuest * 0.45).toLocaleString('en-IN')}/guest.`;
  }
  if (budget >= 300000) {
    return `For a budget of ₹${budget.toLocaleString('en-IN')}, expect ₹${perGuest.toLocaleString('en-IN')} per guest. Mid-range banquet halls and boutique venues are well within reach. Catering typically accounts for ₹1,200–₹2,500/guest.`;
  }
  return `For a budget of ₹${budget.toLocaleString('en-IN')}, expect ₹${perGuest.toLocaleString('en-IN')} per guest. Focus on a single venue for cost efficiency. Home-style or semi-professional catering at ₹800–₹1,500/plate works well at this range.`;
}

function buildTips(event: Event, style: string): string[] {
  const tips: string[] = [];
  if (event.guest_count > 200) tips.push('With 200+ guests, book your venue at least 6 months in advance.');
  if (event.guest_count < 50) tips.push('For intimate gatherings, a farm stay or villa rental often costs 30–40% less than a banquet hall.');
  if (style.includes('Traditional') || style.includes('Royal')) tips.push('Source marigold garlands and diya sets locally — prices vary 3–5× between vendors.');
  if (style.includes('Minimalist') || style.includes('Modern')) tips.push('Minimalist décor saves on florals — invest instead in quality linen and ambient lighting.');
  tips.push(`Book photography and music at least 3 months before ${event.date} to avoid last-minute premiums.`);
  tips.push('Allocate 8–10% of your total budget as a contingency buffer for unexpected expenses.');
  return tips;
}

function buildDemoConcept(event: Event, style: string, colours: string[], decor: string[]): GeneratedConcept {
  const isWedding  = event.event_type.toLowerCase().includes('wedding');
  const isBirthday = event.event_type.toLowerCase().includes('birthday');
  return {
    theme:    `${style} ${event.event_type}`,
    tagline:  `A beautifully curated ${event.event_type.toLowerCase()} in ${event.location}`,
    visual_direction: `Inspired by ${style.toLowerCase()} aesthetics, blending ${colours.slice(0,2).join(' and ') || 'warm neutral'} tones with ${decor.slice(0,2).join(' and ') || 'classic floral'} décor elements.`,
    palette: isWedding
      ? [
          { name: 'Warm Terracotta', hex: '#C85A32' },
          { name: 'Ivory Cream', hex: '#FDFBF7' },
          { name: 'Blush Coral', hex: '#E76F51' },
          { name: 'Marigold Gold', hex: '#E59500' },
          { name: 'Deep Cypress', hex: '#143B36' },
        ]
      : isBirthday
      ? [
          { name: 'Festive Coral', hex: '#E76F51' },
          { name: 'Champagne', hex: '#F4EFE6' },
          { name: 'Gold', hex: '#E59500' },
          { name: 'Rose Blush', hex: '#F4A590' },
        ]
      : [
          { name: 'Deep Teal', hex: '#143B36' },
          { name: 'Marigold', hex: '#E59500' },
          { name: 'Ivory', hex: '#FDFBF7' },
          { name: 'Terracotta', hex: '#C85A32' },
        ],
    entrance_decor: [
      'Grand floral arch with seasonal blooms and trailing greenery at venue entrance',
      'Warm-lit pathway with terracotta urns and marigold torans',
    ],
    table_decor: [
      'Low centrepieces with textured ivory linen runners and pillar candles',
      'Hand-written calligraphed place cards with dried flower accents',
    ],
    lighting: ['Warm amber festoon lights canopied above the dining area', 'Pinspot uplighting highlighting the centrepieces'],
    florals:  ['Wild roses, dahlias and dried pampas in earthy tones', 'Cascading garlands of marigolds and jasmine for traditional touch'],
    menu: isWedding
      ? ['Welcome mocktail with rose and lychee', 'Live chaat station and kebab counter', 'North Indian thali with premium dessert spread']
      : ['Bite-sized canape platter on arrival', 'Interactive live counter — pasta or dosa', 'Celebration cake with petit fours'],
    entertainment: [
      'Acoustic folk or Bollywood duo during welcome reception',
      'Curated playlist for dinner — soulful Carnatic or Sufi fusion',
    ],
    cost_estimate: estimateCost(event.budget, event.guest_count),
    practical_tips: buildTips(event, style),
    is_demo: true,
  };
}
