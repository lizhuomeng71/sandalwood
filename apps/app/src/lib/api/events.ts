// Client-side API calls for events

export interface CreateEventData {
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  capacity?: number;
  category?: string;
  components?: Array<{
    name: string;
    description?: string;
    price?: number | null;
    capacity?: number | null;
    is_required?: boolean;
    display_order?: number;
  }>;
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  capacity?: number;
  category?: string;
}

export interface Event {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  capacity: number | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class EventsAPI {
  private baseUrl = '/api/events';

  async createEvent(data: CreateEventData): Promise<ApiResponse<Event>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || 'Failed to create event' };
      }

      return { data: result.data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to create event' };
    }
  }

  async getEvents(): Promise<ApiResponse<Event[]>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || 'Failed to fetch events' };
      }

      return { data: result.data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to fetch events' };
    }
  }

  async getEvent(id: string): Promise<ApiResponse<Event>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || 'Failed to fetch event' };
      }

      return { data: result.data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to fetch event' };
    }
  }

  async updateEvent(id: string, data: UpdateEventData): Promise<ApiResponse<Event>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || 'Failed to update event' };
      }

      return { data: result.data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to update event' };
    }
  }

  async deleteEvent(id: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || 'Failed to delete event' };
      }

      return { data: { message: result.message } };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to delete event' };
    }
  }
}

export const eventsAPI = new EventsAPI();
