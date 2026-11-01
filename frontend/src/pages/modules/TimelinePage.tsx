import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Event, TaskItem } from '../../types';
import {
  CalendarClock,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Circle,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Clock,
  Flag,
} from 'lucide-react';

const CATEGORIES = ['General', 'Venue', 'Catering', 'Invitations', 'Production', 'Photography', 'Decor', 'Logistics'];
const PRIORITIES: Array<'High' | 'Medium' | 'Low'> = ['High', 'Medium', 'Low'];

const priorityColour = (p: string) => {
  if (p === 'High')   return 'bg-terracotta-100 text-terracotta-700 border-terracotta-200';
  if (p === 'Medium') return 'bg-marigold-100 text-marigold-800 border-marigold-200';
  return 'bg-ivory-200 text-ivory-700 border-ivory-300';
};

export const TimelinePage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newTask, setNewTask] = useState({ title: '', category: 'General', priority: 'Medium' as 'High' | 'Medium' | 'Low', due_date: '' });
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');

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
        const t = plan.timeline as any;
        setTasks(t?.tasks || []);
        setSchedule(t?.day_of_schedule || []);
        if (!newTask.due_date) setNewTask((n) => ({ ...n, due_date: ev.date }));
      })
      .catch((e) => setError(e?.message))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const activeEvent = events.find((e) => e.id === selectedId);

  const handleToggle = async (taskId: string, completed: boolean) => {
    if (!selectedId) return;
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, completed: !completed } : t));
    try {
      await apiService.toggleTask(selectedId, taskId, !completed);
    } catch {
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, completed } : t));
    }
  };

  const handleAdd = () => {
    if (!newTask.title.trim()) return;
    const task: TaskItem = {
      id: `task_${Date.now()}`,
      title: newTask.title.trim(),
      category: newTask.category,
      priority: newTask.priority,
      due_date: newTask.due_date,
      completed: false,
    };
    setTasks((prev) => [...prev, task]);
    setNewTask((n) => ({ ...n, title: '' }));
  };

  const handleDelete = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      await apiService.updateTimeline(selectedId, { tasks, day_of_schedule: schedule, mark_completed: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e?.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'done')    return t.completed;
    return true;
  });

  const done  = tasks.filter((t) => t.completed).length;
  const total = tasks.length;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-ivory-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-coral-600">
            <CalendarClock className="w-3.5 h-3.5" />
            <span>AI Timeline & Task Generator</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ivory-900 mt-1">
            Timeline & Tasks
          </h2>
          <p className="text-sm text-ivory-700 font-light mt-1">
            Manage preparation milestones, priorities and your event-day schedule.
          </p>
        </div>
      </div>

      {saved && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-teal-900 text-ivory-50 shadow-warm-lg border border-teal-700 flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-4 h-4 text-teal-300" /> Timeline saved!
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
          {/* Progress */}
          {total > 0 && (
            <div className="p-5 rounded-2xl bg-ivory-100 border border-ivory-200 shadow-warm-sm space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ivory-800">{done} of {total} tasks complete</span>
                <span className="font-bold text-teal-800">{total > 0 ? Math.round((done / total) * 100) : 0}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-ivory-200 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-terracotta-500 to-teal-700 transition-all" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
              </div>
            </div>
          )}

          {/* Add task */}
          <div className="p-4 rounded-2xl bg-ivory-100 border border-ivory-200 space-y-3">
            <h4 className="font-serif font-bold text-ivory-900">Add Task</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Task title…"
                value={newTask.title}
                onChange={(e) => setNewTask((n) => ({ ...n, title: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="sm:col-span-2 px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ivory-900 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
              />
              <select value={newTask.category} onChange={(e) => setNewTask((n) => ({ ...n, category: e.target.value }))}
                className="px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ivory-900">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={newTask.priority} onChange={(e) => setNewTask((n) => ({ ...n, priority: e.target.value as any }))}
                className="px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ivory-900">
                {PRIORITIES.map((p) => <option key={p} value={p}>{p} Priority</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask((n) => ({ ...n, due_date: e.target.value }))}
                className="px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ivory-900 focus:outline-none"
              />
              <button type="button" onClick={handleAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50">
                <Plus className="w-3.5 h-3.5" /> Add Task
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2">
            {(['all', 'pending', 'done'] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all capitalize ${filter === f ? 'bg-teal-800 text-ivory-50 border-teal-800' : 'bg-ivory-100 text-ivory-700 border-ivory-300 hover:bg-ivory-200'}`}>
                {f} {f === 'all' ? `(${total})` : f === 'pending' ? `(${total - done})` : `(${done})`}
              </button>
            ))}
          </div>

          {/* Task list */}
          {filteredTasks.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-ivory-100 border-2 border-dashed border-ivory-300">
              <CalendarClock className="w-10 h-10 text-ivory-400 mx-auto mb-3" />
              <p className="font-serif font-bold text-ivory-900">No tasks yet</p>
              <p className="text-xs text-ivory-600 mt-1">Add your first preparation milestone above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                    task.completed ? 'bg-ivory-200/60 border-teal-200 opacity-75' : 'bg-ivory-50 border-ivory-200 hover:border-terracotta-300 shadow-warm-sm'
                  }`}
                >
                  <button type="button" onClick={() => handleToggle(task.id, task.completed)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${task.completed ? 'bg-teal-700 border-teal-700 text-ivory-50' : 'border-ivory-400 bg-ivory-50 hover:border-teal-500'}`}>
                    {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium block ${task.completed ? 'line-through text-ivory-500' : 'text-ivory-900'}`}>{task.title}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-ivory-500">{task.category}</span>
                      {task.due_date && <span className="text-[10px] text-ivory-400 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{task.due_date}</span>}
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${priorityColour(task.priority)}`}>
                    {task.priority}
                  </span>

                  <button type="button" onClick={() => handleDelete(task.id)}
                    className="text-ivory-400 hover:text-terracotta-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Event-day schedule */}
          {schedule.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-serif text-lg font-bold text-ivory-900">Event-Day Schedule</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {schedule.map((cue: any) => (
                  <div key={cue.id} className="p-4 rounded-2xl bg-ivory-50 border border-ivory-200 shadow-warm-sm text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-sm text-terracotta-700">{cue.time}</span>
                      {cue.lead && <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">{cue.lead}</span>}
                    </div>
                    <p className="font-semibold text-ivory-900">{cue.title}</p>
                    {cue.description && <p className="text-ivory-600 font-light">{cue.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save */}
          <div className="flex items-center justify-between pt-4 border-t border-ivory-200">
            <p className="text-xs text-ivory-600">Changes are saved per event and persist after refresh.</p>
            <button type="button" onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50 shadow-warm-sm transition-all">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Timeline'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
