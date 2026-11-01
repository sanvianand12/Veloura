import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Event, Vendor } from '../../types';
import {
  Users2,
  Star,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Search,
  IndianRupee,
  MapPin,
  Users,
  Filter,
} from 'lucide-react';

const CATEGORIES = ['All', 'Venue', 'Catering', 'Photography', 'Florist', 'Music', 'Decor'];
const PRICE_TIERS = ['All', 'Budget', 'Mid-Range', 'Premium', 'Luxury'];

export const VendorMatchPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  // Filters
  const [catFilter, setCatFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiService.getEvents().then((evs) => {
      setEvents(evs || []);
      if (evs?.length) setSelectedId(evs[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    apiService.getVendors(selectedId)
      .then(setVendors)
      .catch((e) => setError(e?.message))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const activeEvent = events.find((e) => e.id === selectedId);

  const handleToggle = async (vendorId: string, current: boolean) => {
    if (!selectedId) return;
    setToggling(vendorId);
    try {
      const updated = await apiService.toggleVendorShortlist(selectedId, vendorId, !current);
      // Refresh vendor shortlist state from plan response
      const shortlistedIds: string[] = (updated.vendors as any)?.shortlisted_ids || [];
      setVendors((prev) => prev.map((v) => ({ ...v, is_shortlisted: shortlistedIds.includes(v.id) })));
    } catch (e: any) {
      setError(e?.message);
    } finally {
      setToggling(null);
    }
  };

  const filtered = vendors.filter((v) => {
    if (catFilter  !== 'All' && v.category    !== catFilter)  return false;
    if (tierFilter !== 'All' && v.price_tier  !== tierFilter) return false;
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) &&
                  !v.category.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.match_score - a.match_score);

  const shortlisted = vendors.filter((v) => v.is_shortlisted);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-ivory-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
            <Users2 className="w-3.5 h-3.5" />
            <span>VendorMatch</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ivory-900 mt-1">
            Vendor Discovery & Shortlist
          </h2>
          <p className="text-sm text-ivory-700 font-light mt-1">
            Curated vendors matched to your event's budget, location and style.
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          Demo vendor data
        </div>
      </div>

      {/* Event selector */}
      <div className="p-4 rounded-2xl bg-ivory-100 border border-ivory-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase text-ivory-500 block">Event</span>
          <span className="font-serif font-bold text-ivory-900">{activeEvent?.title || '—'}</span>
          {activeEvent && (
            <p className="text-xs text-ivory-600 mt-0.5">
              {activeEvent.location} · {activeEvent.guest_count} guests · ₹{activeEvent.budget.toLocaleString('en-IN')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedId || ''}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs font-medium text-ivory-900"
          >
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

      {/* Shortlist summary */}
      {shortlisted.length > 0 && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-700" />
            <span className="text-sm font-semibold text-teal-900">{shortlisted.length} vendor{shortlisted.length > 1 ? 's' : ''} shortlisted</span>
            <span className="text-xs text-teal-700">— {shortlisted.map((v) => v.name).join(', ')}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ivory-500" />
          <input
            type="text"
            placeholder="Search vendors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 rounded-xl bg-ivory-100 border border-ivory-300 text-xs text-ivory-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500 w-44"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-ivory-500" />
          <div className="flex gap-1.5">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" onClick={() => setCatFilter(c)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${catFilter === c ? 'bg-teal-800 text-ivory-50 border-teal-800' : 'bg-ivory-100 text-ivory-700 border-ivory-300 hover:bg-ivory-200'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1.5">
          {PRICE_TIERS.map((t) => (
            <button key={t} type="button" onClick={() => setTierFilter(t)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${tierFilter === t ? 'bg-marigold-600 text-ivory-50 border-marigold-600' : 'bg-ivory-100 text-ivory-700 border-ivory-300 hover:bg-ivory-200'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="py-10 text-center"><RefreshCw className="w-6 h-6 animate-spin text-terracotta-500 mx-auto" /></div>}

      {error && (
        <div className="p-4 rounded-xl bg-terracotta-50 border border-terracotta-200 text-xs text-terracotta-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}
        </div>
      )}

      {!loading && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-ivory-600">{filtered.length} vendor{filtered.length !== 1 ? 's' : ''} shown</p>
            <p className="text-xs text-ivory-500">Sorted by match score</p>
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-ivory-100 border-2 border-dashed border-ivory-300">
              <Users2 className="w-10 h-10 text-ivory-400 mx-auto mb-3" />
              <p className="font-serif font-bold text-ivory-900">No vendors match your filters</p>
              <p className="text-xs text-ivory-600 mt-1">Try adjusting category or price tier.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filtered.map((vendor) => (
                <div
                  key={vendor.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    vendor.is_shortlisted
                      ? 'bg-ivory-50 border-teal-400 ring-2 ring-teal-200 shadow-warm'
                      : 'bg-ivory-50 border-ivory-200 shadow-warm-sm hover:shadow-warm'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Badge row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
                          {vendor.category}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-ivory-200 text-ivory-700 border border-ivory-300">
                          {vendor.price_tier}
                        </span>
                        {vendor.is_demo && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Demo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-marigold-600 shrink-0">
                        <Star className="w-3.5 h-3.5" />
                        {vendor.match_score}%
                      </div>
                    </div>

                    {/* Name & meta */}
                    <div>
                      <h4 className="font-serif text-lg font-bold text-ivory-900">{vendor.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-ivory-600 mt-0.5">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{vendor.location}</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-marigold-500" />{vendor.rating} ({vendor.review_count})</span>
                        {vendor.capacity && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{vendor.capacity}</span>}
                      </div>
                    </div>

                    {/* Why recommended */}
                    <div className="p-3 rounded-xl bg-ivory-100/80 border border-ivory-200 text-xs text-ivory-800 leading-relaxed">
                      <strong className="text-teal-800 block text-[10px] uppercase font-bold mb-0.5">Why recommended:</strong>
                      {vendor.why_recommended}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {vendor.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-medium bg-ivory-200 text-ivory-700 px-2 py-0.5 rounded-md">{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-ivory-200 flex items-center justify-between">
                    <span className="text-[11px] text-ivory-500">
                      {vendor.is_demo ? 'Sample pricing — request actual quote' : 'Verified partner'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggle(vendor.id, !!vendor.is_shortlisted)}
                      disabled={toggling === vendor.id}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        vendor.is_shortlisted
                          ? 'bg-teal-800 text-ivory-50 hover:bg-teal-900'
                          : 'bg-ivory-200 hover:bg-ivory-300 text-ivory-900 border border-ivory-300'
                      }`}
                    >
                      {toggling === vendor.id ? '…' : vendor.is_shortlisted ? '✓ Shortlisted' : '+ Shortlist'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
