import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { EventCreateInput } from '../types';
import {
  Sparkles,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  IndianRupee,
  Palette,
  FileText,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowRight
} from 'lucide-react';

const EVENT_TYPES = [
  'Luxury Wedding',
  'Wedding',
  'Birthday Celebration',
  'Anniversary',
  'College Event',
  'Gala',
  'Curated Dinner',
  'Executive Retreat',
  'Vernissage / Art Exhibition',
  'Brand Soirée',
  'Milestone Celebration',
  'Private Concert',
];

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<EventCreateInput>({
    title: '',
    event_type: 'Luxury Wedding',
    date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    time: '18:30',
    location: '',
    guest_count: 100,
    budget: 500000,
    theme: '',
    description: '',
    status: 'Planning',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'guest_count' || name === 'budget'
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim() || formData.title.trim().length < 2) {
      setError('Event title must be at least 2 characters.');
      return;
    }
    if (!formData.location.trim()) {
      setError('Please specify a venue or city.');
      return;
    }
    if (formData.guest_count < 1) {
      setError('Guest count must be at least 1.');
      return;
    }
    if (formData.budget < 0) {
      setError('Budget cannot be negative.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await apiService.createEvent(formData);
      setSuccess(true);
      // Go straight to the event's guided planning workspace
      setTimeout(() => {
        navigate(`/events/${created.id}/workspace`);
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save event. Is the backend running?');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between pb-4 border-b border-ivory-200">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ivory-600 hover:text-terracotta-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="bg-ivory-100 rounded-3xl border border-ivory-200 p-6 sm:p-10 shadow-warm-sm">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-terracotta-50 text-terracotta-700 border border-terracotta-200 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Celebration</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ivory-900">
            Tell us about your event
          </h2>
          <p className="text-sm text-ivory-700 font-light mt-1">
            Fill in the basics and we'll take you straight to your personalised planning workspace.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-terracotta-50 border border-terracotta-200 text-terracotta-900 flex items-start gap-3 text-xs">
            <AlertCircle className="w-5 h-5 text-terracotta-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-sm">Something went wrong</span>
              <p className="mt-0.5 text-terracotta-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
            <div>
              <span className="font-semibold">Event created!</span>
              <p className="text-xs text-teal-700 mt-0.5">Opening your planning workspace…</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Title & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-800">
                Celebration Title <span className="text-terracotta-600">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Priya & Arjun's Wedding"
                className="w-full px-4 py-2.5 rounded-xl bg-ivory-50 border border-ivory-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent text-sm text-ivory-900 placeholder:text-ivory-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-800">
                Event Type
              </label>
              <select
                name="event_type"
                value={formData.event_type}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-50 border border-ivory-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent text-sm text-ivory-900"
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Date, Time, Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-800">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-terracotta-500" />
                  Date
                </span>
              </label>
              <input
                type="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-ivory-50 border border-ivory-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent text-sm text-ivory-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-800">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-coral-500" />
                  Time
                </span>
              </label>
              <input
                type="text"
                name="time"
                value={formData.time || ''}
                onChange={handleChange}
                placeholder="19:00"
                className="w-full px-4 py-2.5 rounded-xl bg-ivory-50 border border-ivory-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent text-sm text-ivory-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-800">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  Venue / City <span className="text-terracotta-600">*</span>
                </span>
              </label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Taj Lake Palace, Udaipur"
                className="w-full px-4 py-2.5 rounded-xl bg-ivory-50 border border-ivory-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent text-sm text-ivory-900"
              />
            </div>
          </div>

          {/* Row 3: Guests, Budget, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-800">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-ivory-500" />
                  Guest Count
                </span>
              </label>
              <input
                type="number"
                name="guest_count"
                min="1"
                max="50000"
                required
                value={formData.guest_count}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-ivory-50 border border-ivory-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent text-sm text-ivory-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-800">
                <span className="flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-terracotta-500" />
                  Budget (₹ INR)
                </span>
              </label>
              <input
                type="number"
                name="budget"
                min="0"
                step="5000"
                required
                value={formData.budget}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-ivory-50 border border-ivory-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent text-sm text-ivory-900"
              />
              <p className="text-[11px] text-ivory-500">
                e.g. ₹5,00,000 for an intimate dinner · ₹25,00,000 for a wedding
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-800">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-50 border border-ivory-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent text-sm text-ivory-900"
              >
                <option value="Planning">Planning</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-800">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-marigold-500" />
                Aesthetic Vibe / Theme <span className="text-ivory-400 font-normal normal-case tracking-normal">(optional)</span>
              </span>
            </label>
            <input
              type="text"
              name="theme"
              value={formData.theme || ''}
              onChange={handleChange}
              placeholder="e.g. Royal Marigold Canopy & Terracotta Lanterns"
              className="w-full px-4 py-2.5 rounded-xl bg-ivory-50 border border-ivory-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent text-sm text-ivory-900 placeholder:text-ivory-400"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-800">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-ivory-500" />
                Notes & Brief <span className="text-ivory-400 font-normal normal-case tracking-normal">(optional)</span>
              </span>
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description || ''}
              onChange={handleChange}
              placeholder="Describe your vision, special requirements, or key moments you want to capture…"
              className="w-full px-4 py-2.5 rounded-xl bg-ivory-50 border border-ivory-300 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent text-sm text-ivory-900 placeholder:text-ivory-400"
            />
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-ivory-200 flex items-center justify-between gap-3">
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-ivory-700 hover:bg-ivory-200 border border-ivory-300 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || success}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50 shadow-warm-sm transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Save className="w-4 h-4 animate-spin" />
                  <span>Saving…</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Opening workspace…</span>
                </>
              ) : (
                <>
                  <span>Create Event</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
