export interface Event {
  id: number;
  title: string;
  event_type: string;
  date: string;
  time?: string | null;
  location: string;
  guest_count: number;
  budget: number;
  theme?: string | null;
  description?: string | null;
  status: 'Planning' | 'Confirmed' | 'Completed' | 'Cancelled';
  created_at: string;
  updated_at: string;
}

export interface EventCreateInput {
  title: string;
  event_type: string;
  date: string;
  time?: string;
  location: string;
  guest_count: number;
  budget: number;
  theme?: string;
  description?: string;
  status?: string;
}

export interface EventStats {
  total_events: number;
  total_budget: number;
  total_guests: number;
  upcoming_events: number;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'offline';
  service: string;
  timestamp: string;
  database: string;
  version: string;
}

// ----------------------------------------------------
// Guided Planning Journey Domain Types
// ----------------------------------------------------

export interface NextStepRecommendation {
  stage: string;
  action_title: string;
  explanation: string;
  button_label: string;
  target_stage: string;
  next_upcoming: string;
}

export interface StageStatus {
  stage_id: string;
  title: string;
  completed: boolean;
  status: 'completed' | 'in_progress' | 'not_started';
  summary: string;
}

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface ConceptData {
  theme: string;
  tagline?: string;
  palette: ColorSwatch[];
  decor_ideas: string[];
  menu_suggestions: string[];
  entertainment_concepts: string[];
  notes?: string;
  is_custom?: boolean;
}

export interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  notes?: string;
}

export interface BudgetExpense {
  id: string;
  category_id: string;
  title: string;
  amount: number;
  date?: string;
  vendor?: string;
}

export interface BudgetData {
  total_budget: number;
  currency: string;
  categories: BudgetCategory[];
  expenses: BudgetExpense[];
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  location: string;
  price_tier: string;
  capacity?: string;
  rating: number;
  review_count: number;
  match_score: number;
  why_recommended: string;
  tags: string[];
  is_demo: boolean;
  is_shortlisted?: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  due_date?: string;
  completed: boolean;
  priority: 'High' | 'Medium' | 'Low';
}

export interface TimelineScheduleItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  lead?: string;
}

export interface TimelineData {
  tasks: TaskItem[];
  day_of_schedule: TimelineScheduleItem[];
}

export interface SpecialRequirementsData {
  dietary_requirements: string[];
  accessibility_requirements: string[];
  personal_notes?: string;
  verified_checklist: Record<string, boolean>;
}

export interface WhatIfScenario {
  id: string;
  title: string;
  description: string;
  cost_impact: number;
  headcount_impact: number;
  action_plan: string;
}

export interface WhatIfData {
  scenarios: WhatIfScenario[];
  non_negotiables: string[];
  contingency_fund: number;
  notes?: string;
}

export interface InvitationsData {
  invitation_message: string;
  whatsapp_caption?: string;
  instagram_announcement?: string;
  rsvp_deadline?: string;
  dress_code?: string;
}

export interface EventPlanResponse {
  event_id: number;
  progress_percentage: number;
  completed_stages: string[];
  stages_checklist: StageStatus[];
  next_step: NextStepRecommendation;
  concept: ConceptData;
  budget: BudgetData;
  vendors: {
    shortlisted_ids?: string[];
  };
  timeline: TimelineData;
  requirements: SpecialRequirementsData;
  what_if: WhatIfData;
  invitations: InvitationsData;
  updated_at: string;
}
