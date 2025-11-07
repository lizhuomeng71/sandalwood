# Using the API

This document shows how to use the API from your web app or mobile app.

## From Web App (Next.js)

Create an API client utility:

```typescript
// apps/app/src/lib/api-client.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchEvents() {
  const response = await fetch(`${API_BASE_URL}/api/events`);
  if (!response.ok) throw new Error('Failed to fetch events');
  return response.json();
}

export async function createEvent(eventData: any) {
  const response = await fetch(`${API_BASE_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  });
  if (!response.ok) throw new Error('Failed to create event');
  return response.json();
}

export async function registerForEvent(eventId: string, userId: string) {
  const response = await fetch(`${API_BASE_URL}/api/registrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_id: eventId, user_id: userId }),
  });
  if (!response.ok) throw new Error('Failed to register');
  return response.json();
}
```

Then use it in your components:

```typescript
// apps/app/src/app/events/page.tsx
import { fetchEvents } from '@/lib/api-client';

export default async function EventsPage() {
  const { data: events } = await fetchEvents();

  return (
    <div>
      {events.map((event) => (
        <div key={event.id}>
          <h2>{event.title}</h2>
          <p>{event.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## From Mobile App (React Native)

Create an API service:

```typescript
// mobile/src/services/api.ts

const API_BASE_URL = __DEV__
  ? 'http://localhost:3001'  // For local development
  : 'https://api.yourdomain.com';  // For production

class ApiService {
  async getEvents() {
    const response = await fetch(`${API_BASE_URL}/api/events`);
    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
  }

  async getEvent(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/events/${id}`);
    if (!response.ok) throw new Error('Failed to fetch event');
    return response.json();
  }

  async createEvent(eventData: any) {
    const response = await fetch(`${API_BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    if (!response.ok) throw new Error('Failed to create event');
    return response.json();
  }

  async registerForEvent(eventId: string, userId: string) {
    const response = await fetch(`${API_BASE_URL}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, user_id: userId }),
    });
    if (!response.ok) throw new Error('Failed to register');
    return response.json();
  }

  async cancelRegistration(registrationId: string) {
    const response = await fetch(`${API_BASE_URL}/api/registrations/${registrationId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to cancel registration');
    return response.json();
  }

  async getEventRegistrations(eventId: string) {
    const response = await fetch(
      `${API_BASE_URL}/api/registrations?event_id=${eventId}`
    );
    if (!response.ok) throw new Error('Failed to fetch registrations');
    return response.json();
  }
}

export const api = new ApiService();
```

Use it in your React Native components:

```typescript
// mobile/src/screens/EventsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { api } from '../services/api';

export function EventsScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const { data } = await api.getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <FlatList
        data={events}
        renderItem={({ item }) => (
          <View>
            <Text>{item.title}</Text>
            <Text>{item.description}</Text>
          </View>
        )}
      />
    </View>
  );
}
```

## Environment Variables

### Web App (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
# Or in production:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Mobile App (.env)
```env
# Not needed - use __DEV__ check in code
```

## Testing the API

You can test the API using curl:

```bash
# Get all events
curl http://localhost:3001/api/events

# Create an event
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Event",
    "description": "A test event",
    "start_time": "2025-11-01T18:00:00Z",
    "end_time": "2025-11-01T20:00:00Z",
    "location": "Test Location"
  }'

# Register for an event
curl -X POST http://localhost:3001/api/registrations \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "event-uuid",
    "user_id": "user-uuid"
  }'
```

## Production Deployment

1. Deploy the API to Vercel/Railway/Render
2. Get the production URL (e.g., `https://api.yourdomain.com`)
3. Update your web app's `NEXT_PUBLIC_API_URL` environment variable
4. Update your mobile app's API_BASE_URL constant
5. Add your production domains to `ALLOWED_ORIGINS` in the API's environment variables
