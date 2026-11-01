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

export const apiService = {
  /**
   * Check backend health and database connectivity
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/health`);
      return await handleResponse<HealthCheckResponse>(res);
    } catch {
      try {
        const fallbackRes = await apiFetch('http://127.0.0.1:8000/health');
        return await handleResponse<HealthCheckResponse>(fallbackRes);
      } catch {
        return {
          status: 'offline',
          service: 'Veloura Backend API (Disconnected)',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
          version: '0.1.0'
        };
      }
    }
  },

  /**
   * Fetch all scheduled events
   */
  async getEvents(): Promise<Event[]> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/events`);
      return await handleResponse<Event[]>(res);
    } catch {
      const fallbackRes = await apiFetch('http://127.0.0.1:8000/api/events');
      return await handleResponse<Event[]>(fallbackRes);
    }
  },

  /**
   * Fetch a single event by ID
   */
  async getEvent(id: number): Promise<Event> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/events/${id}`);
      return await handleResponse<Event>(res);
    } catch {
      const fallbackRes = await apiFetch(`http://127.0.0.1:8000/api/events/${id}`);
      return await handleResponse<Event>(fallbackRes);
    }
  },

  /**
   * Fetch aggregate statistics
   */
  async getStats(): Promise<EventStats> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/events/stats`);
      return await handleResponse<EventStats>(res);
    } catch {
      const fallbackRes = await apiFetch('http://127.0.0.1:8000/api/events/stats');
      return await handleResponse<EventStats>(fallbackRes);
    }
  },

  /**
   * Create a new event
   */
  async createEvent(input: EventCreateInput): Promise<Event> {
    const body = JSON.stringify(input);
    const headers = { 'Content-Type': 'application/json' };

    try {
      const res = await apiFetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        headers,
        body,
      });
      return await handleResponse<Event>(res);
    } catch {
      const fallbackRes = await apiFetch('http://127.0.0.1:8000/api/events', {
        method: 'POST',
        headers,
        body,
      });
      return await handleResponse<Event>(fallbackRes);
    }
  },

  /**
   * Delete an event
   */
  async deleteEvent(id: number): Promise<void> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/events/${id}`, {
        method: 'DELETE',
      });
      await handleResponse<void>(res);
    } catch {
      const fallbackRes = await apiFetch(`http://127.0.0.1:8000/api/events/${id}`, {
        method: 'DELETE',
      });
      await handleResponse<void>(fallbackRes);
    }
  },

  // ----------------------------------------------------
  // Guided Event Planning Journey Endpoints
  // ----------------------------------------------------

  /**
   * Get complete planning journey workspace data & next step
   */
  async getEventPlan(eventId: number): Promise<EventPlanResponse> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/events/${eventId}/plan`);
      return await handleResponse<EventPlanResponse>(res);
    } catch {
      const fallbackRes = await apiFetch(`http://127.0.0.1:8000/api/events/${eventId}/plan`);
      return await handleResponse<EventPlanResponse>(fallbackRes);
    }
  },

  /**
   * Generate AI / intelligent concept for the event
   */
  async generateConcept(eventId: number): Promise<any> {
    const url = `${API_BASE_URL}/api/events/${eventId}/plan/concept/generate`;
    try {
      const res = await apiFetch(url, { method: 'POST' });
      return await handleResponse<any>(res);
    } catch {
      const fallbackRes = await apiFetch(`http://127.0.0.1:8000/api/events/${eventId}/plan/concept/generate`, { method: 'POST' });
      return await handleResponse<any>(fallbackRes);
    }
  },

  /**
   * Save Step 1: Concept
   */
  async updateConcept(eventId: number, data: any): Promise<EventPlanResponse> {
    const url = `${API_BASE_URL}/api/events/${eventId}/plan/concept`;
    const headers = { 'Content-Type': 'application/json' };
    const body = JSON.stringify(data);

    try {
      const res = await apiFetch(url, { method: 'PUT', headers, body });
      return await handleResponse<EventPlanResponse>(res);
    } catch {
      const fallbackRes = await apiFetch(`http://127.0.0.1:8000/api/events/${eventId}/plan/concept`, { method: 'PUT', headers, body });
      return await handleResponse<EventPlanResponse>(fallbackRes);
    }
  },

  /**
   * Save Step 2: Budget (in INR)
   */
  async updateBudget(eventId: number, data: any): Promise<EventPlanResponse> {
    const url = `${API_BASE_URL}/api/events/${eventId}/plan/budget`;
    const headers = { 'Content-Type': 'application/json' };
    const body = JSON.stringify(data);

    try {
      const res = await apiFetch(url, { method: 'PUT', headers, body });
      return await handleResponse<EventPlanResponse>(res);
    } catch {
      const fallbackRes = await apiFetch(`http://127.0.0.1:8000/api/events/${eventId}/plan/budget`, { method: 'PUT', headers, body });
      return await handleResponse<EventPlanResponse>(fallbackRes);
    }
  },

  /**
   * Fetch recommended vendors for Step 3
   */
  async getVendors(eventId: number): Promise<Vendor[]> {
    const url = `${API_BASE_URL}/api/events/${eventId}/plan/vendors`;
    try {
      const res = await apiFetch(url);
      return await handleResponse<Vendor[]>(res);
    } catch {
      const fallbackRes = await apiFetch(`http://127.0.0.1:8000/api/events/${eventId}/plan/vendors`);
      return await handleResponse<Vendor[]>(fallbackRes);
    }
  },

  /**
   * Toggle vendor shortlist
   */
  async toggleVendorShortlist(eventId: number, vendorId: string, shortlisted: boolean): Promise<EventPlanResponse> {
    const url = `${API_BASE_URL}/api/events/${eventId}/plan/vendors/shortlist`;
    const headers = { 'Content-Type': 'application/json' };
    const body = JSON.stringify({ vendor_id: vendorId, shortlisted });

    try {
      const res = await apiFetch(url, { method: 'POST', headers, body });
      return await handleResponse<EventPlanResponse>(res);
    } catch {
      const fallbackRes = await apiFetch(`http://127.0.0.1:8000/api/events/${eventId}/plan/vendors/shortlist`, { method: 'POST', headers, body });
      return await handleResponse<EventPlanResponse>(fallbackRes);
    }
  },

  /**
   * Save Step 4: Timeline & Tasks
   */
  async updateTimeline(eventId: number, data: any): Promise<EventPlanResponse> {
    const url = `${API_BASE_URL}/api/events/${eventId}/plan/timeline`;
    const headers = { 'Content-Type': 'application/json' };
    const body = JSON.stringify(data);

    try {
      const res = await apiFetch(url, { method: 'PUT', headers, body });
      return await handleResponse<EventPlanResponse>(res);
    } catch {
      const fallbackRes = await apiFetch(`http://127.0.0.1:8000/api/events/${eventId}/plan/timeline`, { method: 'PUT', headers, body });
      return await handleResponse<EventPlanResponse>(fallbackRes);
    }
  },

  /**
   * Toggle completion of a specific task item
   */
  async toggleTask(eventId: number, taskId: string, completed: boolean): Promise<EventPlanResponse> {
    const url = `${API_BASE_URL}/api/events/${eventId}/plan/tasks/${taskId}?completed=${completed}`;
    try {
      const res = await apiFetch(url, { method: 'PATCH' });
      return await handleResponse<EventPlanResponse>(res);
    } catch {
      const fallbackRes = await apiFetch(`http://127.0.0.1:8000/api/events/${eventId}/plan/tasks/${taskId}?completed=${completed}`, { method: 'PATCH' });
      return await handleResponse<EventPlanResponse>(fallbackRes);
    }
  },

  /**
   * Save Step 5: Special Requirements
   */
  async updateRequirements(eventId: number, data: any): Promise<EventPlanResponse> {
    const url = `${API_BASE_URL}/api/events/${eventId}/plan/requirements`;
    const headers = { 'Content-Type': 'application/json' };
    const body = JSON.stringify(data);

    try {
      const res = await apiFetch(url, { method: 'PUT', headers, body });
      return await handleResponse<EventPlanResponse>(res);
    } catch {
      const fallbackRes = await apiFetch(`http://127.0.0.1:8000/api/events/${eventId}/plan/requirements`, { method: 'PUT', headers, body });
      return await handleResponse<EventPlanResponse>(fallbackRes);
    }
  },

  /**
   * Save Step 6: What-if Planning
   */
  async updateWhatIf(eventId: number, data: any): Promise<EventPlanResponse> {
    const url = `${API_BASE_URL}/api/events/${eventId}/plan/what-if`;
    const headers = { 'Content-Type': 'application/json' };
    const body = JSON.stringify(data);

    try {
      const res = await apiFetch(url, { method: 'PUT', headers, body });
      return await handleResponse<EventPlanResponse>(res);
    } catch {
      const fallbackRes = await apiFetch(`http://127.0.0.1:8000/api/events/${eventId}/plan/what-if`, { method: 'PUT', headers, body });
      return await handleResponse<EventPlanResponse>(fallbackRes);
    }
  },

  /**
   * Save Step 7: Invitations & Finalisation
   */
  async updateInvitations(eventId: number, data: any): Promise<EventPlanResponse> {
    const url = `${API_BASE_URL}/api/events/${eventId}/plan/invitations`;
    const headers = { 'Content-Type': 'application/json' };
    const body = JSON.stringify(data);

    try {
      const res = await apiFetch(url, { method: 'PUT', headers, body });
      return await handleResponse<EventPlanResponse>(res);
    } catch {
      const fallbackRes = await apiFetch(`http://127.0.0.1:8000/api/events/${eventId}/plan/invitations`, { method: 'PUT', headers, body });
      return await handleResponse<EventPlanResponse>(fallbackRes);
    }
  },
};
