import {
  Event,
  EventCreateInput,
  EventStats,
  HealthCheckResponse,
  EventPlanResponse,
  Vendor,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers || {});
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfResponse = await fetch(`${API_BASE_URL}/api/auth/csrf`, { credentials: 'include' });
    if (!csrfResponse.ok) throw new Error('Could not initialize request security token');
    const { csrf_token: csrfToken } = await csrfResponse.json();
    headers.set('X-CSRF-Token', csrfToken);
  }
  return fetch(input, { ...init, headers, credentials: 'include' });
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    let detail = `Error ${response.status}: ${response.statusText}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.detail) {
        detail = typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail);
      }
    } catch {
      if (errorText) detail = errorText;
    }
    throw new Error(detail);
  }
  if (response.status === 204) {
    return null as T;
  }
  return response.json();
}

function localFallbackUrl(input: RequestInfo | URL): URL {
  const requested = new URL(String(input), window.location.origin);
  return new URL(`${requested.pathname}${requested.search}`, 'http://127.0.0.1:8000');
}

async function apiRequest<T>(input: RequestInfo | URL, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await apiFetch(input, init);
  } catch (error) {
    // Only retry safe reads, and only on a browser network failure in local dev.
    // Never replay writes: a lost response can occur after the server committed.
    const method = (init.method || 'GET').toUpperCase();
    if (!import.meta.env.DEV || method !== 'GET' || !(error instanceof TypeError)) throw error;
    response = await apiFetch(localFallbackUrl(input), init);
  }
  return handleResponse<T>(response);
}

export const apiService = {
  /**
   * Check backend health and database connectivity
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    try {
      return await apiRequest<HealthCheckResponse>(`${API_BASE_URL}/health`);
    } catch {
      return {
        status: 'offline',
        service: 'Veloura Backend API (Disconnected)',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        version: '0.1.0'
      };
    }
  },

  /**
   * Fetch all scheduled events
   */
  async getEvents(): Promise<Event[]> {
    return apiRequest<Event[]>(`${API_BASE_URL}/api/events`);
  },

  /**
   * Fetch a single event by ID
   */
  async getEvent(id: number): Promise<Event> {
    return apiRequest<Event>(`${API_BASE_URL}/api/events/${id}`);
  },

  /**
   * Fetch aggregate statistics
   */
  async getStats(): Promise<EventStats> {
    return apiRequest<EventStats>(`${API_BASE_URL}/api/events/stats`);
  },

  /**
   * Create a new event
   */
  async createEvent(input: EventCreateInput): Promise<Event> {
    const body = JSON.stringify(input);
    const headers = { 'Content-Type': 'application/json' };
    return apiRequest<Event>(`${API_BASE_URL}/api/events`, { method: 'POST', headers, body });
  },

  /**
   * Delete an event
   */
  async deleteEvent(id: number): Promise<void> {
    return apiRequest<void>(`${API_BASE_URL}/api/events/${id}`, { method: 'DELETE' });
  },

  // ----------------------------------------------------
  // Guided Event Planning Journey Endpoints
  // ----------------------------------------------------

  /**
   * Get complete planning journey workspace data & next step
   */
  async getEventPlan(eventId: number): Promise<EventPlanResponse> {
    return apiRequest<EventPlanResponse>(`${API_BASE_URL}/api/events/${eventId}/plan`);
  },

  /**
   * Generate AI / intelligent concept for the event
   */
  async generateConcept(eventId: number): Promise<any> {
    const url = `${API_BASE_URL}/api/events/${eventId}/plan/concept/generate`;
    return apiRequest<any>(url, { method: 'POST' });
  },

  /**
   * Save Step 1: Concept
   */
  async updateConcept(eventId: number, data: any): Promise<EventPlanResponse> {
    const url = `${API_BASE_URL}/api/events/${eventId}/plan/concept`;
    const headers = { 'Content-Type': 'application/json' };
    const body = JSON.stringify(data);

    return apiRequest<EventPlanResponse>(url, { method: 'PUT', headers, body });
  },

  /**
   * Save Step 2: Budget (in INR)
   */
  async updateBudget(eventId: number, data: any): Promise<EventPlanResponse> {
    const url = `${API_BASE_URL}/api/events/${eventId}/plan/budget`;
    const headers = { 'Content-Type': 'application/json' };
    const body = JSON.stringify(data);

    return apiRequest<EventPlanResponse>(url, { method: 'PUT', headers, body });
  },

  /**
   * Fetch recommended vendors for Step 3
   */
  async getVendors(eventId: number): Promise<Vendor[]> {
    const url = `${API_BASE_URL}/api/events/${eventId}/plan/vendors`;
    return apiRequest<Vendor[]>(url);
  },

  /**
   * Toggle vendor shortlist
   */
  async toggleVendorShortlist(eventId: number, vendorId: string, shortlisted: boolean): Promise<EventPlanResponse> {
    const url = `${API_BASE_URL}/api/events/${eventId}/plan/vendors/shortlist`;
    const headers = { 'Content-Type': 'application/json' };
    const body = JSON.stringify({ vendor_id: vendorId, shortlisted });

    return apiRequest<EventPlanResponse>(url, { method: 'POST', headers, body });
  },

  /**
   * Save Step 4: Timeline & Tasks
   */
  async updateTimeline(eventId: number, data: any): Promise<EventPlanResponse> {
    const url = `${API_BASE_URL}/api/events/${eventId}/plan/timeline`;
    const headers = { 'Content-Type': 'application/json' };
    const body = JSON.stringify(data);

    return apiRequest<EventPlanResponse>(url, { method: 'PUT', headers, body });
  },

  /**
   * Toggle completion of a specific task item
   */
  async toggleTask(eventId: number, taskId: string, completed: boolean): Promise<EventPlanResponse> {
    const url = `${API_BASE_URL}/api/events/${eventId}/plan/tasks/${taskId}?completed=${completed}`;
    return apiRequest<EventPlanResponse>(url, { method: 'PATCH' });
  },

  /**
   * Save Step 5: Special Requirements
   */
  async updateRequirements(eventId: number, data: any): Promise<EventPlanResponse> {
    const url = `${API_BASE_URL}/api/events/${eventId}/plan/requirements`;
    const headers = { 'Content-Type': 'application/json' };
    const body = JSON.stringify(data);

    return apiRequest<EventPlanResponse>(url, { method: 'PUT', headers, body });
  },

  /**
   * Save Step 6: What-if Planning
   */
  async updateWhatIf(eventId: number, data: any): Promise<EventPlanResponse> {
    const url = `${API_BASE_URL}/api/events/${eventId}/plan/what-if`;
    const headers = { 'Content-Type': 'application/json' };
    const body = JSON.stringify(data);

    return apiRequest<EventPlanResponse>(url, { method: 'PUT', headers, body });
  },

  /**
   * Save Step 7: Invitations & Finalisation
   */
  async updateInvitations(eventId: number, data: any): Promise<EventPlanResponse> {
    const url = `${API_BASE_URL}/api/events/${eventId}/plan/invitations`;
    const headers = { 'Content-Type': 'application/json' };
    const body = JSON.stringify(data);

    return apiRequest<EventPlanResponse>(url, { method: 'PUT', headers, body });
  },
};
