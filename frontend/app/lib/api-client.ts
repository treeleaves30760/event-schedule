import type { Event, CreateEventInput, UpdateEventInput, ApiResponse, User } from '@/app/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'An error occurred',
        };
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, name?: string) {
    return this.request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async getCurrentUser() {
    return this.request<User>('/api/user/me');
  }

  // Event endpoints
  async getEvents(params?: { completed?: boolean; type?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.completed !== undefined) {
      queryParams.append('completed', params.completed.toString());
    }
    if (params?.type) {
      queryParams.append('type', params.type);
    }

    const query = queryParams.toString();
    return this.request<Event[]>(`/api/events${query ? `?${query}` : ''}`);
  }

  async getEvent(id: string) {
    return this.request<Event>(`/api/events/${id}`);
  }

  async createEvent(data: CreateEventInput) {
    return this.request<Event>('/api/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEvent(id: string, data: UpdateEventInput) {
    return this.request<Event>(`/api/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(id: string) {
    return this.request<{ message: string }>(`/api/events/${id}`, {
      method: 'DELETE',
    });
  }

  // LLM endpoint for creating events from natural language
  async createEventFromNaturalLanguage(prompt: string) {
    return this.request<Event>('/api/events/ai-create', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }
}

export const apiClient = new ApiClient();
