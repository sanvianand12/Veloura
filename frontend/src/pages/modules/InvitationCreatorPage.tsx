import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Event } from '../../types';
import {
  Mail,
  Save,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Sparkles,
  ExternalLink as LinkOut,
} from 'lucide-react';

const DRESS_CODES = [
  'Formal Elegance', 'Indian Traditional', 'Semi-Formal', 'Casual', 'Black Tie',
  'Cocktail Attire', 'Festive Colours', 'All White', 'Ethnic Wear',
];

const STYLES = ['Formal', 'Warm & Personal', 'Traditional', 'Modern & Minimal', 'Celebratory', 'Poetic'];

function generateMessage(ev: Event, style: string, dressCode: string): { formal: string; whatsapp: string; instagram: string } {
  const date    = ev.date;
  const time    = ev.time || '18:30';
  const venue   = ev.location;
  const title   = ev.title;
  const guests  = ev.guest_count;
  const isWed   = ev.event_type.toLowerCase().includes('wedding');
  const isBday  = ev.event_type.toLowerCase().includes('birthday');

  let formal = '';
  if (style === 'Traditional' || style === 'Formal') {
    formal = isWed
      ? `With immense joy and the blessings of our families, we warmly invite you to celebrate the wedding of ${title}.\n\nThe auspicious ceremony will take place on ${date} at ${time}\nat ${venue}.\n\nYour gracious presence will make this occasion truly unforgettable.\n\nKindly RSVP at your earliest convenience.\n\nDress Code: ${dressCode}`
      : `We cordially request the pleasure of your company at ${title}.\n\nDate: ${date} | Time: ${time}\nVenue: ${venue}\n\nYour presence will be our greatest honour.\n\nDress Code: ${dressCode}`;
  } else if (style === 'Warm & Personal') {
    formal = `We'd be absolutely delighted to have you join us for ${title}!\n\nCome celebrate with us on ${date} at ${time} at ${venue}.\n\nIt wouldn't be the same without you there. ${isBday ? '🎉' : '✨'}\n\nDress Code: ${dressCode}`;
  } else {
    formal = `You are invited to ${title}.\n\n📅 ${date} at ${time}\n📍 ${venue}\n\nWe look forward to celebrating with you.\nDress Code: ${dressCode}`;
  }

  const whatsapp = isWed
    ? `✨ You're invited! ✨\n\nJoin us for *${title}* 💐\n📅 *${date}* at *${time}*\n📍 ${venue}\n\nKindly confirm your attendance. We can't wait to celebrate with you! 🎊\nDress Code: ${dressCode}`
    : `🎉 You're invited to *${title}*!\n\n📅 ${date} • ${time}\n📍 ${venue}\n\nWe'd love to see you there! Please RSVP.\nDress Code: ${dressCode}`;

  const instagram = isWed
    ? `Counting down the days 💍✨ ${title} | ${date} · ${venue} #VelouraWedding #${date.replace(/-/g, '')}`
    : `It's almost time! 🎊 ${title} | ${date} · ${venue} #VelouraCelebration`;

  return { formal, whatsapp, instagram };
}

export const InvitationCreatorPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [style, setStyle] = useState('Warm & Personal');
  const [dressCode, setDressCode] = useState('Formal Elegance');
  const [rsvpDeadline, setRsvpDeadline] = useState('');
  const [formal, setFormal] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');

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
        const inv = plan.invitations as any;
        setRsvpDeadline(inv?.rsvp_deadline || ev.date);
        if (inv?.invitation_message) {
          setFormal(inv.invitation_message);
          setWhatsapp(inv.whatsapp_caption || '');
          setInstagram(inv.instagram_announcement || '');
          setDressCode(inv.dress_code || 'Formal Elegance');
        } else {
          // Auto-generate on first load
          const msgs = generateMessage(ev, style, dressCode);
          setFormal(msgs.formal);
          setWhatsapp(msgs.whatsapp);
          setInstagram(msgs.instagram);
        }
      })
      .catch((e) => setError(e?.message))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const activeEvent = events.find((e) => e.id === selectedId);

  const handleGenerate = () => {
    if (!activeEvent) return;
    const msgs = generateMessage(activeEvent, style, dressCode);
    setFormal(msgs.formal);
    setWhatsapp(msgs.whatsapp);
    setInstagram(msgs.instagram);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      await apiService.updateInvitations(selectedId, {
        invitation_message: formal,
        whatsapp_caption: whatsapp,
        instagram_announcement: instagram,
        rsvp_deadline: rsvpDeadline,
        dress_code: dressCode,
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

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-ivory-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-marigold-600">
            <Mail className="w-3.5 h-3.5" />
            <span>AI Invitation Creator</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ivory-900 mt-1">
            Invitations & Announcements
          </h2>
          <p className="text-sm text-ivory-700 font-light mt-1">
            Generate beautiful invitation copy, WhatsApp messages and social captions — then save them to your event.
          </p>
        </div>
      </div>

      {saved && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-teal-900 text-ivory-50 shadow-warm-lg border border-teal-700 flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-4 h-4 text-teal-300" /> Invitations saved!
        </div>
      )}

      {/* Event selector */}
      <div className="p-4 rounded-2xl bg-ivory-100 border border-ivory-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase text-ivory-500 block">Event</span>
          <span className="font-serif font-bold text-ivory-900">{activeEvent?.title || '—'}</span>
          {activeEvent && <p className="text-xs text-ivory-600 mt-0.5">{activeEvent.date} · {activeEvent.location}</p>}
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
          {/* Preferences */}
          <div className="p-5 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm space-y-4">
            <h3 className="font-serif font-bold text-ivory-900">Invitation Style</h3>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-700">Tone</label>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button key={s} type="button" onClick={() => setStyle(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${style === s ? 'bg-marigold-600 text-ivory-50 border-marigold-600' : 'bg-ivory-50 text-ivory-800 border-ivory-300 hover:bg-ivory-200'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-700">Dress Code</label>
                <select value={dressCode} onChange={(e) => setDressCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ivory-900">
                  {DRESS_CODES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-700">RSVP Deadline</label>
                <input type="date" value={rsvpDeadline} onChange={(e) => setRsvpDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ivory-900 focus:outline-none" />
              </div>
            </div>

            <button type="button" onClick={handleGenerate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50 shadow-warm-sm transition-all">
              <Sparkles className="w-4 h-4" />
              Generate Invitation Copy
            </button>
          </div>

          {/* Invitation texts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Formal */}
            <div className="p-5 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ivory-900 uppercase tracking-wider">Formal Invitation</span>
                <button type="button" onClick={() => handleCopy(formal, 'formal')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta-600 hover:text-terracotta-700">
                  {copiedKey === 'formal' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'formal' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <textarea
                rows={8}
                value={formal}
                onChange={(e) => setFormal(e.target.value)}
                className="w-full p-3 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ivory-900 font-serif leading-relaxed focus:outline-none focus:ring-2 focus:ring-terracotta-500 resize-none"
              />
            </div>

            {/* WhatsApp */}
            <div className="p-5 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">WhatsApp Broadcast</span>
                <button type="button" onClick={() => handleCopy(whatsapp, 'whatsapp')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
                  {copiedKey === 'whatsapp' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'whatsapp' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <textarea
                rows={8}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full p-3 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ivory-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>
          </div>

          {/* Instagram */}
          <div className="p-5 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-marigold-700 uppercase tracking-wider">Instagram Announcement</span>
              <button type="button" onClick={() => handleCopy(instagram, 'instagram')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-marigold-700 hover:text-marigold-800">
                {copiedKey === 'instagram' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'instagram' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <textarea
              rows={2}
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="w-full p-3 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ivory-900 focus:outline-none focus:ring-2 focus:ring-marigold-500 resize-none"
            />
          </div>

          {/* Master Plan preview link */}
          {activeEvent && (
            <div className="p-4 rounded-2xl bg-ivory-200/60 border border-ivory-300 flex items-center justify-between gap-3">
              <p className="text-xs text-ivory-700">Save invitations to see the visual invitation card in your Master Plan.</p>
              <a href={`/events/${activeEvent.id}/master-plan`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline">
                <LinkOut className="w-3.5 h-3.5" /> View Master Plan
              </a>
            </div>
          )}

          {/* Save */}
          <div className="flex items-center justify-between pt-4 border-t border-ivory-200">
            <p className="text-xs text-ivory-600">Saved per event. Appears in your Master Plan with visual invitation preview.</p>
            <button type="button" onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-marigold-600 hover:bg-marigold-700 text-ivory-50 shadow-warm-sm transition-all">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Invitations'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
