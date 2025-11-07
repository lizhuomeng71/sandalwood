# Events API - Implementation Summary

## Overview
I've successfully created a complete events management system with database schema, CRUD operations, and server actions.

## What Was Created

### 1. Database Migration
**File**: `apps/api/supabase/migrations/20251028000001_create_events_table.sql`

**Schema**:
```sql
events table:
  - id (uuid, primary key)
  - user_id (uuid, foreign key to users)
  - title (text, required)
  - description (text, optional)
  - start_date (timestamptz, required)
  - end_date (timestamptz, optional)
  - location (text, optional)
  - capacity (integer, optional)
  - created_at (timestamptz)
  - updated_at (timestamptz)
```

**Features**:
- ✓ Row Level Security (RLS) enabled
- ✓ Users can view all events
- ✓ Users can only create/update/delete their own events
- ✓ Auto-updating timestamps
- ✓ Validation constraints (end_date >= start_date, capacity > 0)
- ✓ Indexes on user_id and start_date for performance

**Status**: ✅ Migration applied successfully

### 2. TypeScript Types
**File**: `packages/supabase/src/types/db.ts`

Generated types include:
- `Row` - Complete event row type
- `Insert` - Type for creating events
- `Update` - Type for updating events
- Relationship types to users table

**Status**: ✅ Types generated

### 3. Query Functions (READ operations)
**File**: `packages/supabase/src/queries/index.ts`

```typescript
getEvents()           // Get all events, ordered by start_date
getEvent(id)          // Get single event by ID
getEventsByUser(userId) // Get all events for a specific user
```

**Status**: ✅ Implemented

### 4. Mutation Functions (CREATE, UPDATE, DELETE)
**File**: `packages/supabase/src/mutations/index.ts`

```typescript
createEvent(data)        // Create new event
updateEvent(id, data)    // Update existing event
deleteEvent(id)          // Delete event
```

**Status**: ✅ Implemented with proper error handling and logging

### 5. Server Actions with Validation
**Directory**: `apps/app/src/actions/event/`

**Files**:
- `schema.ts` - Zod validation schemas
- `create-event-action.ts` - Create event
- `update-event-action.ts` - Update event
- `delete-event-action.ts` - Delete event
- `get-event-action.ts` - Get single event
- `get-events-action.ts` - Get all events
- `index.ts` - Barrel export

**Features**:
- ✓ Input validation with Zod
- ✓ Authentication required
- ✓ Rate limiting
- ✓ Analytics tracking
- ✓ Sentry error monitoring

**Status**: ✅ All CRUD actions implemented

## How to Use

### 1. Import the Server Actions

```typescript
import {
  createEventAction,
  updateEventAction,
  deleteEventAction,
  getEventAction,
  getEventsAction,
} from "@/actions/event";
```

### 2. Create an Event

```typescript
const result = await createEventAction({
  title: "Team Meeting",
  description: "Quarterly planning session",
  start_date: "2024-11-01T10:00:00Z",
  end_date: "2024-11-01T12:00:00Z",
  location: "Conference Room A",
  capacity: 20,
});

if (result.data) {
  console.log("Event created:", result.data);
}
```

### 3. Get All Events

```typescript
const result = await getEventsAction();

if (result.data) {
  console.log("Events:", result.data);
}
```

### 4. Get Single Event

```typescript
const result = await getEventAction({
  eventId: "event-uuid-here",
});

if (result.data) {
  console.log("Event:", result.data);
}
```

### 5. Update an Event

```typescript
const result = await updateEventAction({
  eventId: "event-uuid-here",
  title: "Updated Meeting Title",
  capacity: 25,
});

if (result.data) {
  console.log("Event updated:", result.data);
}
```

### 6. Delete an Event

```typescript
const result = await deleteEventAction({
  eventId: "event-uuid-here",
});

if (result.data?.success) {
  console.log("Event deleted successfully");
}
```

### 7. Direct Database Access (if needed)

You can also use the query and mutation functions directly:

```typescript
import { getEvents, createEvent } from "@v1/supabase/queries";
import { updateEvent, deleteEvent } from "@v1/supabase/mutations";

// These bypass the server action middleware (auth, rate limiting, analytics)
// Only use these if you need direct database access
```

## Testing

To test the API endpoints:

1. **Start the API (Supabase)**:
   ```bash
   bunx supabase start
   ```

2. **Start the App**:
   ```bash
   bun run dev:app
   ```

3. **Use the actions in your React components**:
   ```typescript
   "use client";

   import { createEventAction } from "@/actions/event";
   import { useAction } from "next-safe-action/hooks";

   export function CreateEventForm() {
     const { execute, result } = useAction(createEventAction);

     const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
       e.preventDefault();
       const formData = new FormData(e.currentTarget);

       execute({
         title: formData.get("title") as string,
         start_date: formData.get("start_date") as string,
         // ... other fields
       });
     };

     return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
   }
   ```

## Database Commands

```bash
# Run migrations
cd apps/api && bunx supabase db reset --local

# Generate types after schema changes
cd apps/api && bunx supabase gen types --lang=typescript --local --schema public > ../../packages/supabase/src/types/db.ts
```

## API Endpoints Summary

| Action | Function | Auth Required | Rate Limited | Analytics |
|--------|----------|---------------|--------------|-----------|
| Create Event | `createEventAction` | ✓ | ✓ | ✓ |
| Update Event | `updateEventAction` | ✓ | ✓ | ✓ |
| Delete Event | `deleteEventAction` | ✓ | ✓ | ✓ |
| Get Event | `getEventAction` | ✓ | ✓ | ✓ |
| Get Events | `getEventsAction` | ✓ | ✓ | ✓ |

## Security

- **Row Level Security (RLS)**: Enabled on events table
- **Authentication**: All actions require authenticated user
- **Authorization**: Users can only modify their own events
- **Validation**: All inputs validated with Zod schemas
- **Rate Limiting**: IP-based rate limiting via Upstash KV

## Notes

- Events are automatically ordered by `start_date` in ascending order
- The `updated_at` timestamp is automatically updated on every modification
- All mutations return the full event object after the operation
- Proper error handling and logging is implemented throughout
- Analytics events are tracked for all CRUD operations

## Next Steps

1. Create React components for event management UI
2. Add pagination for large event lists
3. Implement event search/filtering
4. Add event categories or tags
5. Implement event registration/RSVP functionality
6. Add calendar view integration
