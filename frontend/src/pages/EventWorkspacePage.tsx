import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import {
  Event,
  EventPlanResponse,
  Vendor,
  TaskItem,
  BudgetCategory,
  BudgetExpense,
  WhatIfScenario,
} from '../types';
import {
  Sparkles,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Coins,
  CheckCircle2,
  Circle,
  Clock4,
  ArrowRight,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  Palette,
  WalletCards,
  Users2,
  CalendarClock,
  ShieldCheck,
  SlidersHorizontal,
  Mail,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  Save,
  PartyPopper
} from 'lucide-react';

export const EventWorkspacePage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [plan, setPlan] = useState<EventPlanResponse | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStage, setSavingStage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('concept');
  const [notification, setNotification] = useState<string | null>(null);
  const [generatingConcept, setGeneratingConcept] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Editable form states for each stage
  const [conceptForm, setConceptForm] = useState<any>({
    theme: '',
    tagline: '',
    palette: [],
    decor_ideas: [],
    menu_suggestions: [],
    entertainment_concepts: [],
    notes: '',
  });

  const [budgetForm, setBudgetForm] = useState<{
    total_budget: number;
    currency: string;
    categories: BudgetCategory[];
    expenses: BudgetExpense[];
  }>({
    total_budget: 0,
    currency: 'INR',
    categories: [],
    expenses: [],
  });

  const [newExpense, setNewExpense] = useState({
    title: '',
    category_id: 'venue',
    amount: '',
    vendor: '',
  });

  const [timelineTasks, setTimelineTasks] = useState<TaskItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('General');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  const [requirementsForm, setRequirementsForm] = useState({
    dietary_requirements: [] as string[],
    accessibility_requirements: [] as string[],
    personal_notes: '',
    verified_checklist: {} as Record<string, boolean>,
  });
  const [newDietaryItem, setNewDietaryItem] = useState('');
  const [newAccessItem, setNewAccessItem] = useState('');

  const [whatIfForm, setWhatIfForm] = useState({
    scenarios: [] as WhatIfScenario[],
    non_negotiables: [] as string[],
    contingency_fund: 0,
    notes: '',
  });
  const [newNonNegotiable, setNewNonNegotiable] = useState('');

  const [invitationsForm, setInvitationsForm] = useState({
    invitation_message: '',
    whatsapp_caption: '',
    instagram_announcement: '',
    rsvp_deadline: '',
    dress_code: '',
  });

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadWorkspace = async (id: number) => {
    setLoading(true);
    try {
      const [eventsList, eventData, planData, vendorList] = await Promise.all([
        apiService.getEvents(),
        apiService.getEvent(id),
        apiService.getEventPlan(id),
        apiService.getVendors(id),
      ]);

      setAllEvents(eventsList || []);
      setCurrentEvent(eventData);
      setPlan(planData);
      setVendors(vendorList || []);

      // Populate stage forms
      if (planData.concept) {
        setConceptForm({
          theme: planData.concept.theme || eventData.theme || '',
          tagline: planData.concept.tagline || '',
          palette: planData.concept.palette || [],
          decor_ideas: planData.concept.decor_ideas || [],
          menu_suggestions: planData.concept.menu_suggestions || [],
          entertainment_concepts: planData.concept.entertainment_concepts || [],
          notes: planData.concept.notes || '',
        });
      }

      if (planData.budget) {
        setBudgetForm({
          total_budget: planData.budget.total_budget || eventData.budget || 0,
          currency: planData.budget.currency || 'INR',
          categories: planData.budget.categories || [],
          expenses: planData.budget.expenses || [],
        });
      }

      if (planData.timeline) {
        setTimelineTasks(planData.timeline.tasks || []);
      }

      if (planData.requirements) {
        setRequirementsForm({
          dietary_requirements: planData.requirements.dietary_requirements || [],
          accessibility_requirements: planData.requirements.accessibility_requirements || [],
          personal_notes: planData.requirements.personal_notes || '',
          verified_checklist: planData.requirements.verified_checklist || {},
        });
      }

      if (planData.what_if) {
        setWhatIfForm({
          scenarios: planData.what_if.scenarios || [],
          non_negotiables: planData.what_if.non_negotiables || [],
          contingency_fund: planData.what_if.contingency_fund || 0,
          notes: planData.what_if.notes || '',
        });
      }

      if (planData.invitations) {
        setInvitationsForm({
          invitation_message: planData.invitations.invitation_message || '',
          whatsapp_caption: planData.invitations.whatsapp_caption || '',
          instagram_announcement: planData.invitations.instagram_announcement || '',
          rsvp_deadline: planData.invitations.rsvp_deadline || eventData.date,
          dress_code: planData.invitations.dress_code || 'Formal Elegance',
        });
      }

      // Default active tab to next recommended step if not set
      if (planData.next_step?.target_stage) {
        setActiveTab(planData.next_step.target_stage);
      }
    } catch (err: any) {
      showNotification(`Error loading workspace: ${err?.message || 'Server error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      loadWorkspace(Number(eventId));
    }
  }, [eventId]);

  // Personalized Heading Generator
  const personalizedGreeting = useMemo(() => {
    if (!currentEvent) return "Let's plan your celebration!";
    const type = currentEvent.event_type.toLowerCase();
    if (type.includes('wedding')) return "Let's plan your wedding!";
    if (type.includes('gala')) return "Let's orchestrate your signature Gala!";
    if (type.includes('dinner')) return "Let's plan your curated dining experience!";
    if (type.includes('retreat')) return "Let's plan your executive retreat!";
    if (type.includes('vernissage') || type.includes('art')) return "Let's curate your vernissage & exhibition!";
    if (type.includes('birthday') || type.includes('milestone')) return "Let's plan your milestone celebration!";
    return `Let's plan your ${currentEvent.event_type}!`;
  }, [currentEvent]);

  // Stage 1: Generate AI Concept
  const handleGenerateConcept = async () => {
    if (!currentEvent) return;
    setGeneratingConcept(true);
    try {
      const generated = await apiService.generateConcept(currentEvent.id);
      setConceptForm({
        theme: generated.theme || conceptForm.theme,
        tagline: generated.tagline || conceptForm.tagline,
        palette: generated.palette || conceptForm.palette,
        decor_ideas: generated.decor_ideas || conceptForm.decor_ideas,
        menu_suggestions: generated.menu_suggestions || conceptForm.menu_suggestions,
        entertainment_concepts: generated.entertainment_concepts || conceptForm.entertainment_concepts,
        notes: conceptForm.notes,
      });
      showNotification('Generated bespoke aesthetic concept & palette!');
    } catch {
      showNotification('Could not generate concept from AI. Using existing parameters.');
    } finally {
      setGeneratingConcept(false);
    }
  };

  // Stage 1 Save
  const handleSaveConcept = async () => {
    if (!currentEvent) return;
    setSavingStage('concept');
    try {
      const updatedPlan = await apiService.updateConcept(currentEvent.id, {
        ...conceptForm,
        mark_completed: true,
      });
      setPlan(updatedPlan);
      showNotification('✓ Event Concept saved and marked complete!');
    } catch (err: any) {
      showNotification(`Error: ${err?.message}`);
    } finally {
      setSavingStage(null);
    }
  };

  // Stage 2 Save & Expenses
  const handleAddExpense = () => {
    if (!newExpense.title.trim() || !newExpense.amount) return;
    const amountNum = parseFloat(newExpense.amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const expenseItem: BudgetExpense = {
      id: `exp_${Date.now()}`,
      category_id: newExpense.category_id,
      title: newExpense.title.trim(),
      amount: amountNum,
      date: new Date().toISOString().split('T')[0],
      vendor: newExpense.vendor.trim() || undefined,
    };

    // Update category spent amount
    const updatedCategories = budgetForm.categories.map((cat) => {
      if (cat.id === newExpense.category_id) {
        return { ...cat, spent: (cat.spent || 0) + amountNum };
      }
      return cat;
    });

    setBudgetForm((prev) => ({
      ...prev,
      categories: updatedCategories,
      expenses: [expenseItem, ...prev.expenses],
    }));

    setNewExpense({ title: '', category_id: 'venue', amount: '', vendor: '' });
  };

  const handleSaveBudget = async () => {
    if (!currentEvent) return;
    setSavingStage('budget');
    try {
      const updatedPlan = await apiService.updateBudget(currentEvent.id, {
        ...budgetForm,
        mark_completed: true,
      });
      setPlan(updatedPlan);
      showNotification('✓ Budget allocations in INR saved and marked complete!');
    } catch (err: any) {
      showNotification(`Error: ${err?.message}`);
    } finally {
      setSavingStage(null);
    }
  };

  // Stage 3 Vendor Shortlist Toggle
  const handleToggleShortlist = async (vendorId: string, currentStatus: boolean) => {
    if (!currentEvent) return;
    const newStatus = !currentStatus;
    try {
      const updatedPlan = await apiService.toggleVendorShortlist(currentEvent.id, vendorId, newStatus);
      setPlan(updatedPlan);
      setVendors((prev) =>
        prev.map((v) => (v.id === vendorId ? { ...v, is_shortlisted: newStatus } : v))
      );
      showNotification(newStatus ? 'Vendor shortlisted to your celebration!' : 'Removed vendor from shortlist.');
    } catch (err: any) {
      showNotification(`Error: ${err?.message}`);
    }
  };

  // Stage 4 Timeline Task Toggle
  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    if (!currentEvent) return;
    const nextVal = !currentCompleted;
    setTimelineTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: nextVal } : t))
    );

    try {
      const updatedPlan = await apiService.toggleTask(currentEvent.id, taskId, nextVal);
      setPlan(updatedPlan);
    } catch {
      // Revert if error
      setTimelineTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: currentCompleted } : t))
      );
    }
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const task: TaskItem = {
      id: `task_${Date.now()}`,
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      due_date: currentEvent?.date,
      completed: false,
      priority: newTaskPriority,
    };
    setTimelineTasks((prev) => [...prev, task]);
    setNewTaskTitle('');
  };

  const handleSaveTimeline = async () => {
    if (!currentEvent) return;
    setSavingStage('timeline');
    try {
      const updatedPlan = await apiService.updateTimeline(currentEvent.id, {
        tasks: timelineTasks,
        day_of_schedule: plan?.timeline?.day_of_schedule || [],
        mark_completed: true,
      });
      setPlan(updatedPlan);
      showNotification('✓ Timeline milestones & run of show saved!');
    } catch (err: any) {
      showNotification(`Error: ${err?.message}`);
    } finally {
      setSavingStage(null);
    }
  };

  // Stage 5 Requirements Save
  const handleSaveRequirements = async () => {
    if (!currentEvent) return;
    setSavingStage('requirements');
    try {
      const updatedPlan = await apiService.updateRequirements(currentEvent.id, {
        ...requirementsForm,
        mark_completed: true,
      });
      setPlan(updatedPlan);
      showNotification('✓ Special dietary & accessibility requirements saved!');
    } catch (err: any) {
      showNotification(`Error: ${err?.message}`);
    } finally {
      setSavingStage(null);
    }
  };

  // Stage 6 What-if Save
  const handleSaveWhatIf = async () => {
    if (!currentEvent) return;
    setSavingStage('what_if');
    try {
      const updatedPlan = await apiService.updateWhatIf(currentEvent.id, {
        ...whatIfForm,
        mark_completed: true,
      });
      setPlan(updatedPlan);
      showNotification('✓ What-if contingencies and non-negotiables saved!');
    } catch (err: any) {
      showNotification(`Error: ${err?.message}`);
    } finally {
      setSavingStage(null);
    }
  };

  // Stage 7 Invitations Save
  const handleSaveInvitations = async () => {
    if (!currentEvent) return;
    setSavingStage('invitations');
    try {
      const updatedPlan = await apiService.updateInvitations(currentEvent.id, {
        ...invitationsForm,
        mark_completed: true,
      });
      setPlan(updatedPlan);
      showNotification('✓ Invitations copy & readiness checklists saved!');
    } catch (err: any) {
      showNotification(`Error: ${err?.message}`);
    } finally {
      setSavingStage(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showNotification(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  if (loading) {
    return (
      <div className="py-20 text-center max-w-xl mx-auto space-y-4">
        <RefreshCw className="w-8 h-8 text-terracotta-600 animate-spin mx-auto" />
        <h3 className="font-serif text-xl font-bold text-ivory-900">
          Entering Guided Workspace...
        </h3>
        <p className="text-xs text-ivory-600">
          Loading event parameters, progress state, and intelligent recommendations.
        </p>
      </div>
    );
  }

  if (!currentEvent || !plan) {
    return (
      <div className="py-16 text-center max-w-lg mx-auto space-y-4">
        <AlertTriangle className="w-10 h-10 text-terracotta-500 mx-auto" />
        <h3 className="font-serif text-2xl font-bold text-ivory-900">
          Celebration Not Found
        </h3>
        <p className="text-sm text-ivory-700">
          The requested event could not be retrieved from your local SQLite database.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-terracotta-600 text-ivory-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Master Dashboard</span>
        </Link>
      </div>
    );
  }

  // Budget calculations in INR
  const totalAllocated = budgetForm.categories.reduce((acc, c) => acc + (c.allocated || 0), 0);
  const totalSpent = budgetForm.categories.reduce((acc, c) => acc + (c.spent || 0), 0);
  const remainingBudget = Math.max(0, budgetForm.total_budget - totalSpent);

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-teal-900 text-ivory-50 shadow-warm-lg border border-teal-700 flex items-center gap-3 text-xs sm:text-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Breadcrumb & Event Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-ivory-200">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-ivory-600 hover:text-terracotta-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Master Plan Link */}
          <Link
            to={`/events/${currentEvent.id}/master-plan`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-teal-800 hover:bg-teal-900 text-ivory-50 transition-all shadow-warm-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Master Plan</span>
          </Link>

          {/* Multi-Event Switcher */}
          {allEvents.length > 1 && (
            <div className="flex items-center gap-2 bg-ivory-100 px-3 py-1.5 rounded-xl border border-ivory-300 text-xs">
              <span className="text-ivory-500 font-medium">Switch:</span>
              <select
                value={currentEvent.id}
                onChange={(e) => navigate(`/events/${e.target.value}/workspace`)}
                className="bg-transparent font-semibold text-ivory-900 focus:outline-none cursor-pointer"
              >
                {allEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.event_type})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Welcoming Personalized Workspace Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-ivory-100 border border-ivory-200 shadow-warm-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-terracotta-50 text-terracotta-700 border border-terracotta-200 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal Celebration Assistant</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ivory-900">
              {personalizedGreeting}
            </h1>
            <p className="mt-1 text-sm text-ivory-700 font-light">
              Guiding you step-by-step through every phase of <strong className="font-semibold text-ivory-900">{currentEvent.title}</strong>.
            </p>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 text-xs">
              <span className="text-ivory-500 block text-[10px] uppercase font-semibold">Date & Time</span>
              <div className="font-medium text-ivory-900 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-terracotta-600" />
                <span className="truncate">{currentEvent.date}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 text-xs">
              <span className="text-ivory-500 block text-[10px] uppercase font-semibold">Location</span>
              <div className="font-medium text-ivory-900 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span className="truncate">{currentEvent.location}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 text-xs">
              <span className="text-ivory-500 block text-[10px] uppercase font-semibold">Guest Count</span>
              <div className="font-medium text-ivory-900 mt-0.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-marigold-600" />
                <span>{currentEvent.guest_count} attendees</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 text-xs">
              <span className="text-ivory-500 block text-[10px] uppercase font-semibold">Target Budget</span>
              <div className="font-medium text-terracotta-700 mt-0.5 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-terracotta-600" />
                <span>₹{Number(currentEvent.budget).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Planning Progress Bar */}
        <div className="pt-4 border-t border-ivory-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-ivory-800">
              Celebration Orchestration Progress
            </span>
            <span className="font-serif font-bold text-sm text-teal-800">
              {plan.progress_percentage}% Orchestrated ({plan.completed_stages.length} of 7 Stages)
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-ivory-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-terracotta-500 via-coral-500 to-teal-700 transition-all duration-700"
              style={{ width: `${Math.max(plan.progress_percentage, 5)}%` }}
            />
          </div>
        </div>
      </div>

      {/* PROMINENT "YOUR NEXT STEP" CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-teal-900 via-teal-950 to-ivory-900 text-ivory-50 shadow-warm-lg border border-teal-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-marigold-500 text-ivory-900">
              <Sparkles className="w-3.5 h-3.5" />
              <span>YOUR NEXT STEP</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
              {plan.next_step.action_title}
            </h2>
            <p className="text-sm text-teal-100 font-light leading-relaxed">
              <strong className="font-semibold text-marigold-300">Why this matters: </strong>
              {plan.next_step.explanation}
            </p>
            <div className="text-xs text-teal-300 flex items-center gap-1.5 pt-1">
              <span>Next up after this:</span>
              <span className="font-semibold text-ivory-100">{plan.next_step.next_upcoming}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (plan.next_step.target_stage === 'master_plan') {
                navigate(`/events/${currentEvent.id}/master-plan`);
              } else {
                setActiveTab(plan.next_step.target_stage);
                const el = document.getElementById('stage-workspace');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl text-sm font-bold bg-coral-500 hover:bg-coral-600 active:scale-98 text-ivory-50 shadow-warm transition-all group shrink-0"
          >
            <span>{plan.next_step.button_label}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* VISUAL CHECKLIST OF ALL 7 PLANNING STAGES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-bold text-ivory-900">
              Planning Journey Stages
            </h3>
            <p className="text-xs text-ivory-600 font-light">
              Click any stage to view, edit, or customize details. You can revisit completed stages at any time.
            </p>
          </div>
          <span className="text-xs font-medium text-teal-800 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
            {plan.completed_stages.length}/7 Completed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {plan.stages_checklist.map((stageItem, index) => {
            const isSelected = activeTab === stageItem.stage_id;
            return (
              <button
                key={stageItem.stage_id}
                type="button"
                onClick={() => {
                  setActiveTab(stageItem.stage_id);
                  const el = document.getElementById('stage-workspace');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-ivory-50 border-terracotta-500 ring-2 ring-terracotta-300 shadow-warm'
                    : stageItem.completed
                    ? 'bg-ivory-100 border-teal-300/80 hover:bg-ivory-200/80'
                    : 'bg-ivory-100 border-ivory-200 hover:bg-ivory-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ivory-500">
                      Step {index + 1}
                    </span>
                    {stageItem.completed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md">
                        <Check className="w-3 h-3" /> Done
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-ivory-600 bg-ivory-200 px-2 py-0.5 rounded-md">
                        <Clock4 className="w-3 h-3" /> Ready
                      </span>
                    )}
                  </div>

                  <h4 className="font-serif font-bold text-sm text-ivory-900">
                    {stageItem.title}
                  </h4>
                  <p className="text-xs text-ivory-600 line-clamp-1 mt-1 font-light">
                    {stageItem.summary}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-ivory-200/70 flex items-center justify-between text-[11px] font-semibold text-terracotta-600">
                  <span>{isSelected ? 'Currently Viewing' : 'Open Stage'}</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* ACTIVE STAGE WORKSPACE INTERFACE                     */}
      {/* ---------------------------------------------------- */}
      <div id="stage-workspace" className="p-6 sm:p-10 rounded-3xl bg-ivory-100 border border-ivory-200 shadow-warm-sm space-y-8">

        {/* STAGE 1: EVENT CONCEPT */}
        {activeTab === 'concept' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-ivory-200">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-terracotta-600">
                  <Palette className="w-3.5 h-3.5" />
                  <span>Stage 1 of 7</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-ivory-900 mt-1">
                  Event Concept & Aesthetic Direction
                </h3>
                <p className="text-xs sm:text-sm text-ivory-700 font-light mt-0.5">
                  Establish custom themes, curated color swatches, decoration concepts, and sensory culinary sketches.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateConcept}
                disabled={generatingConcept}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-ivory-50 hover:bg-ivory-200 border border-ivory-300 text-terracotta-700 shadow-warm-sm transition-all disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 text-marigold-500 ${generatingConcept ? 'animate-spin' : ''}`} />
                <span>{generatingConcept ? 'Curating Concepts...' : 'Generate Creative Ideas'}</span>
              </button>
            </div>

            {/* Theme & Tagline */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-800">
                  Aesthetic Theme Name
                </label>
                <input
                  type="text"
                  value={conceptForm.theme}
                  onChange={(e) => setConceptForm({ ...conceptForm, theme: e.target.value })}
                  placeholder="e.g. Royal Terracotta & Amber Lanterns"
                  className="w-full px-4 py-2.5 rounded-xl bg-ivory-50 border border-ivory-300 text-sm font-semibold text-ivory-900 focus:ring-2 focus:ring-terracotta-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-800">
                  Atmospheric Tagline
                </label>
                <input
                  type="text"
                  value={conceptForm.tagline || ''}
                  onChange={(e) => setConceptForm({ ...conceptForm, tagline: e.target.value })}
                  placeholder="e.g. Intimate lakeside feast"
                  className="w-full px-4 py-2.5 rounded-xl bg-ivory-50 border border-ivory-300 text-sm text-ivory-900 focus:ring-2 focus:ring-terracotta-500"
                />
              </div>
            </div>

            {/* Curated Color Palette */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-800">
                Curated Color Palette ({conceptForm.palette.length} swatches)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {conceptForm.palette.map((color: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-2xl bg-ivory-50 border border-ivory-200 flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-xl shadow-warm-sm border border-ivory-300 shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-ivory-900 block truncate">
                        {color.name}
                      </span>
                      <span className="text-[10px] font-mono text-ivory-500 uppercase">
                        {color.hex}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Decoration & Floral Ideas */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-800">
                Decoration & Scenography Ideas
              </label>
              <div className="space-y-2">
                {conceptForm.decor_ideas.map((idea: string, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-ivory-50 border border-ivory-200 text-xs text-ivory-800">
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500"></span>
                      <span>{idea}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setConceptForm({
                          ...conceptForm,
                          decor_ideas: conceptForm.decor_ideas.filter((_: any, i: number) => i !== idx),
                        })
                      }
                      className="text-ivory-400 hover:text-terracotta-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Menu Suggestions & Culinary Direction */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-800">
                Culinary Sequences & Menu Sketches
              </label>
              <div className="space-y-2">
                {conceptForm.menu_suggestions.map((dish: string, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-ivory-50 border border-ivory-200 text-xs text-ivory-800">
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                      <span>{dish}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setConceptForm({
                          ...conceptForm,
                          menu_suggestions: conceptForm.menu_suggestions.filter((_: any, i: number) => i !== idx),
                        })
                      }
                      className="text-ivory-400 hover:text-terracotta-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Entertainment Concepts */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-800">
                Acoustic & Entertainment Concepts
              </label>
              <div className="space-y-2">
                {conceptForm.entertainment_concepts.map((act: string, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-ivory-50 border border-ivory-200 text-xs text-ivory-800">
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-marigold-500"></span>
                      <span>{act}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setConceptForm({
                          ...conceptForm,
                          entertainment_concepts: conceptForm.entertainment_concepts.filter((_: any, i: number) => i !== idx),
                        })
                      }
                      className="text-ivory-400 hover:text-terracotta-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Action */}
            <div className="pt-6 border-t border-ivory-200 flex items-center justify-between">
              <span className="text-xs text-ivory-600 font-light">
                Saving marks this stage complete and unlocks next step recommendations.
              </span>
              <button
                type="button"
                onClick={handleSaveConcept}
                disabled={savingStage === 'concept'}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50 shadow-warm-sm transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{savingStage === 'concept' ? 'Saving...' : 'Save & Complete Concept'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: BUDGET PLANNING IN INR */}
        {activeTab === 'budget' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-ivory-200">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-marigold-600">
                  <WalletCards className="w-3.5 h-3.5" />
                  <span>Stage 2 of 7</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-ivory-900 mt-1">
                  Budget Planning & Expense Tracking (INR ₹)
                </h3>
                <p className="text-xs sm:text-sm text-ivory-700 font-light mt-0.5">
                  Allocate expenditure limits across core categories, log payments, and maintain emergency buffers.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-marigold-100 text-marigold-800 border border-marigold-200">
                  Currency: INR (₹)
                </span>
              </div>
            </div>

            {/* Financial Overview Cards in INR */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-ivory-50 border border-ivory-200 shadow-warm-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-ivory-500">
                  Total Budget Ceiling
                </span>
                <div className="font-serif text-2xl sm:text-3xl font-bold text-ivory-900 mt-1">
                  ₹{budgetForm.total_budget.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-ivory-600 block mt-1">
                  ₹{totalAllocated.toLocaleString('en-IN')} allocated across {budgetForm.categories.length} categories
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-ivory-50 border border-ivory-200 shadow-warm-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-terracotta-600">
                  Committed / Spent
                </span>
                <div className="font-serif text-2xl sm:text-3xl font-bold text-terracotta-700 mt-1">
                  ₹{totalSpent.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-terracotta-600 block mt-1">
                  {((totalSpent / (budgetForm.total_budget || 1)) * 100).toFixed(1)}% of budget utilized
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-ivory-50 border border-ivory-200 shadow-warm-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                  Remaining Buffer
                </span>
                <div className="font-serif text-2xl sm:text-3xl font-bold text-teal-800 mt-1">
                  ₹{remainingBudget.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-teal-700 block mt-1">
                  Available for contingency & final retainers
                </span>
              </div>
            </div>

            {/* Category Allocations */}
            <div className="space-y-4">
              <h4 className="font-serif text-lg font-bold text-ivory-900">
                Category Allocations
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgetForm.categories.map((cat, idx) => (
                  <div key={cat.id} className="p-4 rounded-2xl bg-ivory-50 border border-ivory-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ivory-900">{cat.name}</span>
                      <span className="text-xs font-mono font-semibold text-terracotta-700">
                        ₹{(cat.allocated || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-ivory-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-teal-600"
                        style={{
                          width: `${Math.min(100, ((cat.spent || 0) / (cat.allocated || 1)) * 100)}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-ivory-600">
                      <span>Spent: ₹{(cat.spent || 0).toLocaleString('en-IN')}</span>
                      <span>Left: ₹{Math.max(0, (cat.allocated || 0) - (cat.spent || 0)).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Logger */}
            <div className="p-5 rounded-2xl bg-ivory-50 border border-ivory-200 space-y-4">
              <h4 className="font-serif text-base font-bold text-ivory-900">
                Log New Expense
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Expense description (e.g. Venue deposit)"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-ivory-100 border border-ivory-300 text-xs text-ivory-900"
                />
                <select
                  value={newExpense.category_id}
                  onChange={(e) => setNewExpense({ ...newExpense, category_id: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-ivory-100 border border-ivory-300 text-xs text-ivory-900"
                >
                  {budgetForm.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Amount in INR (₹)"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-ivory-100 border border-ivory-300 text-xs text-ivory-900"
                />
                <button
                  type="button"
                  onClick={handleAddExpense}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50 transition-colors"
                >
                  Add Expense
                </button>
              </div>

              {budgetForm.expenses.length > 0 && (
                <div className="mt-4 pt-4 border-t border-ivory-200 space-y-2">
                  <span className="text-[11px] font-semibold text-ivory-600 uppercase">
                    Recorded Expenses ({budgetForm.expenses.length})
                  </span>
                  {budgetForm.expenses.map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-ivory-100 border border-ivory-200/80">
                      <div>
                        <span className="font-semibold text-ivory-900">{exp.title}</span>
                        <span className="text-ivory-500 ml-2">({exp.category_id})</span>
                      </div>
                      <span className="font-mono font-bold text-terracotta-700">
                        ₹{exp.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Action */}
            <div className="pt-6 border-t border-ivory-200 flex items-center justify-between">
              <span className="text-xs text-ivory-600 font-light">
                Updates budget ledger and triggers next stage recommendations.
              </span>
              <button
                type="button"
                onClick={handleSaveBudget}
                disabled={savingStage === 'budget'}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50 shadow-warm-sm transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{savingStage === 'budget' ? 'Saving...' : 'Save & Complete Budget'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: VENDOR DISCOVERY */}
        {activeTab === 'vendors' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-ivory-200">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
                  <Users2 className="w-3.5 h-3.5" />
                  <span>Stage 3 of 7</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-ivory-900 mt-1">
                  Vetted Vendor Discovery & Shortlist
                </h3>
                <p className="text-xs sm:text-sm text-ivory-700 font-light mt-0.5">
                  Curated partners matched to your celebration's location, headcount, and aesthetic profile.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  {vendors.filter((v) => v.is_shortlisted).length} Shortlisted
                </span>
              </div>
            </div>

            {/* Vendor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {vendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                    vendor.is_shortlisted
                      ? 'bg-ivory-50 border-teal-500 ring-2 ring-teal-300 shadow-warm'
                      : 'bg-ivory-50 border-ivory-200 shadow-warm-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                          {vendor.category}
                        </span>
                        {vendor.is_demo && (
                          <span className="text-[10px] font-semibold text-ivory-500 bg-ivory-200 px-2 py-0.5 rounded-md">
                            Demo Partner
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-marigold-600">
                        {vendor.match_score}% Match
                      </div>
                    </div>

                    <h4 className="font-serif text-xl font-bold text-ivory-900">
                      {vendor.name}
                    </h4>
                    <p className="text-xs text-ivory-600 mt-0.5">
                      {vendor.location} • Price Tier: {vendor.price_tier} • Rating: ★ {vendor.rating} ({vendor.review_count} reviews)
                    </p>

                    {/* Why Recommended Callout */}
                    <div className="mt-3 p-3 rounded-xl bg-ivory-100/90 border border-ivory-200 text-xs text-ivory-800 leading-relaxed font-light">
                      <strong className="font-semibold text-teal-800 block text-[11px] mb-0.5">
                        Why Recommended:
                      </strong>
                      {vendor.why_recommended}
                    </div>

                    {/* Tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {vendor.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-medium bg-ivory-200 text-ivory-800 px-2 py-0.5 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-ivory-200 flex items-center justify-between">
                    <span className="text-xs font-medium text-ivory-600">
                      {vendor.capacity || 'Flexible capacity'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleShortlist(vendor.id, !!vendor.is_shortlisted)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        vendor.is_shortlisted
                          ? 'bg-teal-800 text-ivory-50 hover:bg-teal-900'
                          : 'bg-ivory-200 hover:bg-ivory-300 text-ivory-900 border border-ivory-300'
                      }`}
                    >
                      {vendor.is_shortlisted ? '✓ Shortlisted' : '+ Shortlist Vendor'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-ivory-200 flex items-center justify-between">
              <span className="text-xs text-ivory-600 font-light">
                Shortlisting at least 1 partner satisfies this stage.
              </span>
              <button
                type="button"
                onClick={() => {
                  showNotification('✓ Vendor selections verified!');
                  setActiveTab('timeline');
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50 shadow-warm-sm transition-all"
              >
                <span>Proceed to Timeline & Tasks</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 4: TIMELINE AND TASKS */}
        {activeTab === 'timeline' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-ivory-200">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-coral-600">
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>Stage 4 of 7</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-ivory-900 mt-1">
                  Preparation Milestones & Run-of-Show
                </h3>
                <p className="text-xs sm:text-sm text-ivory-700 font-light mt-0.5">
                  Track vital preparation checklists, assign priorities, and synchronize the day-of timing.
                </p>
              </div>

              <div className="text-xs font-semibold px-3 py-1 rounded-full bg-coral-100 text-coral-800 border border-coral-200">
                {timelineTasks.filter((t) => t.completed).length} of {timelineTasks.length} Tasks Finished
              </div>
            </div>

            {/* Interactive Task Checklist */}
            <div className="space-y-4">
              <h4 className="font-serif text-lg font-bold text-ivory-900">
                Actionable Milestone Checklist
              </h4>
              <div className="space-y-2.5">
                {timelineTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id, task.completed)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      task.completed
                        ? 'bg-ivory-200/60 border-teal-300 opacity-75'
                        : 'bg-ivory-50 border-ivory-200 hover:border-terracotta-300 shadow-warm-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        task.completed ? 'bg-teal-700 border-teal-700 text-ivory-50' : 'border-ivory-400 bg-ivory-50'
                      }`}>
                        {task.completed && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <span className={`text-xs font-medium block ${task.completed ? 'line-through text-ivory-500' : 'text-ivory-900'}`}>
                          {task.title}
                        </span>
                        <span className="text-[10px] text-ivory-500">
                          {task.category} • Target: {task.due_date || 'By celebration day'}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      task.priority === 'High'
                        ? 'bg-terracotta-100 text-terracotta-700'
                        : task.priority === 'Medium'
                        ? 'bg-marigold-100 text-marigold-800'
                        : 'bg-ivory-200 text-ivory-700'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Custom Task Form */}
              <div className="p-4 rounded-2xl bg-ivory-50 border border-ivory-200 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  placeholder="Add custom milestone (e.g. Schedule final floral walkthrough)"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full sm:flex-1 px-3 py-2 rounded-xl bg-ivory-100 border border-ivory-300 text-xs text-ivory-900"
                />
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-ivory-100 border border-ivory-300 text-xs text-ivory-900"
                >
                  <option value="General">General</option>
                  <option value="Catering">Catering</option>
                  <option value="Venue">Venue</option>
                  <option value="Invitations">Invitations</option>
                  <option value="Production">Production</option>
                </select>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-ivory-100 border border-ivory-300 text-xs text-ivory-900"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50 shrink-0"
                >
                  Add Task
                </button>
              </div>
            </div>

            {/* Day-of Run of Show Schedule */}
            <div className="space-y-3">
              <h4 className="font-serif text-lg font-bold text-ivory-900">
                Celebration Day Run-of-Show
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(plan.timeline.day_of_schedule || []).map((cue) => (
                  <div key={cue.id} className="p-4 rounded-2xl bg-ivory-50 border border-ivory-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-sm text-terracotta-700">{cue.time}</span>
                      <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        Lead: {cue.lead}
                      </span>
                    </div>
                    <span className="font-semibold text-ivory-900 block">{cue.title}</span>
                    <p className="text-ivory-600 font-light">{cue.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Action */}
            <div className="pt-6 border-t border-ivory-200 flex items-center justify-between">
              <span className="text-xs text-ivory-600 font-light">
                Updates saved to SQLite database.
              </span>
              <button
                type="button"
                onClick={handleSaveTimeline}
                disabled={savingStage === 'timeline'}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50 shadow-warm-sm transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{savingStage === 'timeline' ? 'Saving...' : 'Save & Complete Timeline'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STAGE 5: SPECIAL REQUIREMENTS */}
        {activeTab === 'requirements' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-ivory-200">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Stage 5 of 7</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-ivory-900 mt-1">
                  Special Requirements & Hospitality Audit
                </h3>
                <p className="text-xs sm:text-sm text-ivory-700 font-light mt-0.5">
                  Audit dietary protocols, step-free wheelchair accessibility, and neurodivergent sensory care.
                </p>
              </div>
            </div>

            {/* Dietary Requirements */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-800">
                Dietary & Allergen Safeguards
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Jain Vegetarian Options',
                  '100% Celiac/Gluten-Free Counter',
                  'Nut-Allergy Isolation Protocol',
                  'Halal Certified Suppliers',
                  'Vegan Dessert Parity',
                  'Non-Alcoholic Botanical Mocktail Bar',
                ].map((preset) => {
                  const isChecked = requirementsForm.dietary_requirements.includes(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        const next = isChecked
                          ? requirementsForm.dietary_requirements.filter((x) => x !== preset)
                          : [...requirementsForm.dietary_requirements, preset];
                        setRequirementsForm({ ...requirementsForm, dietary_requirements: next });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        isChecked
                          ? 'bg-teal-800 text-ivory-50 border-teal-800'
                          : 'bg-ivory-50 text-ivory-800 border-ivory-300 hover:bg-ivory-200'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '} {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accessibility Protocols */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-800">
                Physical Accessibility & Spatial Dignity
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Step-Free Venue Entrance Ramp',
                  'Wheelchair Accessible Washroom Egress',
                  'Reserved Front-Row Seating for Elders',
                  'Low-Sensory Quiet Alcove',
                  'High Contrast Signage & Font Sizes',
                ].map((preset) => {
                  const isChecked = requirementsForm.accessibility_requirements.includes(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        const next = isChecked
                          ? requirementsForm.accessibility_requirements.filter((x) => x !== preset)
                          : [...requirementsForm.accessibility_requirements, preset];
                        setRequirementsForm({ ...requirementsForm, accessibility_requirements: next });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        isChecked
                          ? 'bg-terracotta-700 text-ivory-50 border-terracotta-700'
                          : 'bg-ivory-50 text-ivory-800 border-ivory-300 hover:bg-ivory-200'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '} {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Personal Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-800">
                Cultural, Religious or Personal Directives
              </label>
              <textarea
                rows={3}
                value={requirementsForm.personal_notes}
                onChange={(e) => setRequirementsForm({ ...requirementsForm, personal_notes: e.target.value })}
                placeholder="Special ceremonial rites, prayer timing accommodations, child entertainment corner..."
                className="w-full px-4 py-2.5 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ivory-900"
              />
            </div>

            {/* Save Action */}
            <div className="pt-6 border-t border-ivory-200 flex items-center justify-between">
              <span className="text-xs text-ivory-600 font-light">
                Ensures all guest care considerations are locked in.
              </span>
              <button
                type="button"
                onClick={handleSaveRequirements}
                disabled={savingStage === 'requirements'}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50 shadow-warm-sm transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{savingStage === 'requirements' ? 'Saving...' : 'Save & Complete Requirements'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STAGE 6: REVIEW AND WHAT-IF PLANNING */}
        {activeTab === 'what_if' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-ivory-200">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-terracotta-600">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Stage 6 of 7</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-ivory-900 mt-1">
                  What-if Simulation & Non-Negotiable Guardrails
                </h3>
                <p className="text-xs sm:text-sm text-ivory-700 font-light mt-0.5">
                  Stress-test contingencies (weather shifts, 20% headcount surges) and protect non-negotiables.
                </p>
              </div>
            </div>

            {/* Pre-Computed Scenarios */}
            <div className="space-y-4">
              <h4 className="font-serif text-lg font-bold text-ivory-900">
                Stress-Test Scenarios
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {whatIfForm.scenarios.map((scen) => (
                  <div key={scen.id} className="p-5 rounded-2xl bg-ivory-50 border border-ivory-200 space-y-2 shadow-warm-sm">
                    <span className="font-serif font-bold text-base text-ivory-900 block">
                      {scen.title}
                    </span>
                    <p className="text-xs text-ivory-700 font-light">
                      {scen.description}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-ivory-200/80 text-xs">
                      <span className="font-semibold text-terracotta-700">
                        Cost Impact: +₹{scen.cost_impact.toLocaleString('en-IN')}
                      </span>
                      <span className="text-teal-800 font-medium">
                        Plan: {scen.action_plan}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Non-Negotiable Preferences */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ivory-800">
                Non-Negotiable Elements (Will not be compromised in contingency)
              </label>
              <div className="space-y-2">
                {whatIfForm.non_negotiables.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-ivory-50 border border-ivory-200 text-xs text-ivory-900">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-marigold-500"></span>
                      <span>{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setWhatIfForm({
                          ...whatIfForm,
                          non_negotiables: whatIfForm.non_negotiables.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-ivory-400 hover:text-terracotta-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Traditional acoustic folk instruments during welcome"
                  value={newNonNegotiable}
                  onChange={(e) => setNewNonNegotiable(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-ivory-50 border border-ivory-300 text-xs text-ivory-900"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newNonNegotiable.trim()) {
                      setWhatIfForm({
                        ...whatIfForm,
                        non_negotiables: [...whatIfForm.non_negotiables, newNonNegotiable.trim()],
                      });
                      setNewNonNegotiable('');
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-terracotta-600 text-ivory-50"
                >
                  Add Non-Negotiable
                </button>
              </div>
            </div>

            {/* Save Action */}
            <div className="pt-6 border-t border-ivory-200 flex items-center justify-between">
              <span className="text-xs text-ivory-600 font-light">
                Secures contingency buffers and non-negotiables.
              </span>
              <button
                type="button"
                onClick={handleSaveWhatIf}
                disabled={savingStage === 'what_if'}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50 shadow-warm-sm transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{savingStage === 'what_if' ? 'Saving...' : 'Save & Complete What-if'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STAGE 7: INVITATIONS AND FINALISATION */}
        {activeTab === 'invitations' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-ivory-200">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-marigold-600">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Stage 7 of 7 (Final Stage)</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-ivory-900 mt-1">
                  Invitations, Announcements & Readiness Summary
                </h3>
                <p className="text-xs sm:text-sm text-ivory-700 font-light mt-0.5">
                  Generate refined invitation messages, WhatsApp family broadcasts, and review the final readiness scorecard.
                </p>
              </div>
            </div>

            {/* Copyable Message Generators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Formal Invitation */}
              <div className="p-6 rounded-2xl bg-ivory-50 border border-ivory-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ivory-900 uppercase tracking-wider">
                    Formal Invitation Copy
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(invitationsForm.invitation_message, 'Formal Invitation')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta-600 hover:text-terracotta-700"
                  >
                    {copiedText === 'Formal Invitation' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText === 'Formal Invitation' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={invitationsForm.invitation_message}
                  onChange={(e) => setInvitationsForm({ ...invitationsForm, invitation_message: e.target.value })}
                  className="w-full p-3 rounded-xl bg-ivory-100 border border-ivory-300 text-xs text-ivory-900 font-serif leading-relaxed"
                />
              </div>

              {/* WhatsApp Broadcast */}
              <div className="p-6 rounded-2xl bg-ivory-50 border border-ivory-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                    WhatsApp Broadcast Copy
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(invitationsForm.whatsapp_caption, 'WhatsApp Broadcast')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800"
                  >
                    {copiedText === 'WhatsApp Broadcast' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText === 'WhatsApp Broadcast' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={invitationsForm.whatsapp_caption}
                  onChange={(e) => setInvitationsForm({ ...invitationsForm, whatsapp_caption: e.target.value })}
                  className="w-full p-3 rounded-xl bg-ivory-100 border border-ivory-300 text-xs text-ivory-900 leading-relaxed font-sans"
                />
              </div>
            </div>

            {/* Readiness Scorecard */}
            <div className="p-6 rounded-3xl bg-ivory-200/60 border border-ivory-300 space-y-4">
              <div className="flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-terracotta-600" />
                <h4 className="font-serif text-lg font-bold text-ivory-900">
                  Celebration Readiness Summary
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200">
                  <span className="text-ivory-500 block text-[10px]">Aesthetic Concept</span>
                  <span className="font-bold text-teal-800">
                    {plan.stages_checklist[0]?.completed ? '✓ Completed' : 'Pending'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200">
                  <span className="text-ivory-500 block text-[10px]">Budget Status</span>
                  <span className="font-bold text-teal-800">
                    {plan.stages_checklist[1]?.completed ? '✓ Allocated' : 'Pending'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200">
                  <span className="text-ivory-500 block text-[10px]">Shortlisted Vendors</span>
                  <span className="font-bold text-teal-800">
                    {vendors.filter((v) => v.is_shortlisted).length} partners
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200">
                  <span className="text-ivory-500 block text-[10px]">Tasks Progress</span>
                  <span className="font-bold text-teal-800">
                    {timelineTasks.filter((t) => t.completed).length}/{timelineTasks.length} Done
                  </span>
                </div>
              </div>
            </div>

            {/* Save Action */}
            <div className="pt-6 border-t border-ivory-200 flex items-center justify-between">
              <span className="text-xs text-ivory-600 font-light">
                Marks your final celebration stage complete!
              </span>
              <button
                type="button"
                onClick={handleSaveInvitations}
                disabled={savingStage === 'invitations'}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-terracotta-600 hover:bg-terracotta-700 text-ivory-50 shadow-warm-sm transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{savingStage === 'invitations' ? 'Saving...' : 'Finalise Celebration Journey'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

