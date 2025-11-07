# Event Components System - Complete Implementation

## Overview
Events can now include multiple components (sub-items) that attendees can register for. Components are flexible items like lift tickets, equipment rentals, meals, transportation, etc. Each event category has default component templates that auto-populate when selected.

## Database Schema

### event_components Table
**Location**: `apps/api/supabase/migrations/20251028120000_create_event_components_table.sql`

**Schema**:
```sql
CREATE TABLE public.event_components (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    price numeric(10, 2),
    capacity integer,
    current_registrations integer DEFAULT 0,
    is_required boolean DEFAULT false,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

**Fields**:
- `event_id` - Foreign key to events table (cascade delete)
- `name` - Component name (e.g., "Lift Ticket", "Equipment Rental")
- `description` - Optional details about the component
- `price` - Optional price (can be null for free components)
- `capacity` - Optional capacity limit (null = unlimited)
- `current_registrations` - Tracks how many people have registered (default 0)
- `is_required` - Whether all attendees must have this component
- `display_order` - Order to display components

**Constraints**:
- Capacity must be positive if specified
- Current registrations must be >= 0
- Current registrations cannot exceed capacity
- Auto-updates `updated_at` timestamp

**Row Level Security (RLS)**:
- ✅ Anyone can view components
- ✅ Only event owners can create components
- ✅ Only event owners can update components
- ✅ Only event owners can delete components

### component_templates Table
**Location**: Same migration file

**Purpose**: Stores default component templates by event category.

**Schema**:
```sql
CREATE TABLE public.component_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category text NOT NULL,
    name text NOT NULL,
    description text,
    default_price numeric(10, 2),
    is_required boolean DEFAULT false,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);
```

**Default Templates Included**:

#### Ski & Snow Events
- Lift Ticket ($89, required)
- Ski Rental ($45)
- Snowboard Rental ($45)
- Helmet Rental ($10)
- Lesson ($75)
- Lunch ($25)
- Transportation ($30)

#### Hiking Events
- Guided Tour ($50)
- Equipment Rental ($15)
- Packed Lunch ($20)
- Transportation ($25)
- Park Entry Fee ($10, required)

#### Outdoor Events (General)
- Equipment Rental
- Meals
- Transportation
- Permits & Fees

#### Skating Events
- Rink Admission ($15, required)
- Skate Rental ($10)
- Lesson ($40)
- Locker Rental ($5)

#### Games Events
- Venue Fee (required)
- Equipment
- Refreshments

#### Other/Generic Events
- Activity Fee (required)
- Equipment
- Meals
- Transportation
- Insurance

## API Implementation

### Queries
**Location**: `packages/supabase/src/queries/index.ts`

```typescript
// Get all components for an event
export async function getEventComponents(eventId: string)

// Get default component templates for a category
export async function getComponentTemplates(category: string)
```

### Mutations
**Location**: `packages/supabase/src/mutations/index.ts`

```typescript
// Create a single component
export async function createEventComponent(data: TablesInsert<"event_components">)

// Create multiple components at once
export async function createEventComponents(components: TablesInsert<"event_components">[])

// Update a component
export async function updateEventComponent(componentId: string, data: TablesUpdate<"event_components">)

// Delete a component
export async function deleteEventComponent(componentId: string)
```

### Server Actions
**Location**: `apps/app/src/actions/event/`

**Updated Schema** (`schema.ts`):
```typescript
export const eventComponentSchema = z.object({
  name: z.string().min(1, "Component name is required"),
  description: z.string().optional(),
  price: z.number().nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  is_required: z.boolean().optional(),
  display_order: z.number().int().optional(),
});

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime().optional(),
  location: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  category: z.string().optional(),
  components: z.array(eventComponentSchema).optional(),  // NEW
});
```

**Updated Create Event Action** (`create-event-action.ts`):
- Now accepts `components` array in input
- Creates event first
- Then creates all components in a single batch insert
- Returns event with components attached

**Usage**:
```typescript
import { createEventAction } from "@/actions/event";

const result = await createEventAction({
  title: "Whistler Ski Weekend",
  category: "ski-snow",
  start_date: "2024-12-01T09:00:00Z",
  end_date: "2024-12-03T17:00:00Z",
  location: "Whistler, BC",
  capacity: 20,
  components: [
    {
      name: "Lift Ticket",
      description: "3-day lift pass",
      price: 250.00,
      is_required: true,
      display_order: 0,
    },
    {
      name: "Equipment Rental",
      description: "Skis, boots, and poles",
      price: 75.00,
      capacity: 15,  // Only 15 rentals available
      is_required: false,
      display_order: 1,
    },
  ],
});
```

## Frontend Implementation

### Event Creation Wizard
**Location**: `apps/app/src/app/(default)/community/meetups/create/create-event-wizard.tsx`

**New Interface**:
```typescript
interface EventComponent {
  id: string
  name: string
  description?: string
  price?: number | null
  capacity?: number | null
  is_required: boolean
  display_order: number
}
```

**Added to EventFormData**:
```typescript
interface EventFormData {
  // ... existing fields
  eventComponents: EventComponent[]
}
```

**New Functions**:
```typescript
// Load default templates when category is selected
loadDefaultComponents(category: string)

// Add a new blank component
addEventComponent()

// Update a component
updateEventComponent(id: string, updates: Partial<EventComponent>)

// Remove a component
removeEventComponent(id: string)
```

### Step 1: Auto-Load Components by Category
When a user selects an event category in Step 1, default component templates are automatically loaded:

```typescript
<select
  value={formData.category}
  onChange={(e) => {
    const newCategory = e.target.value
    updateFormData({ category: newCategory })
    // Load default components for this category
    if (newCategory && formData.eventComponents.length === 0) {
      loadDefaultComponents(newCategory)
    }
  }}
>
  <option value="">Select a category</option>
  <option value="ski-snow">Ski & Snow</option>
  <option value="hiking">Hiking</option>
  {/* ... */}
</select>
```

A confirmation message appears: "✓ Default components loaded for this category (you can customize them in Step 4)"

### Step 4: Manage Components
A new section has been added to Step 4 (Cost & Split) for managing event components:

**Features**:
- View all components
- Add new components manually
- Edit component details:
  - Name (required)
  - Price (optional)
  - Capacity (optional, null = unlimited)
  - Required checkbox
  - Description (optional)
- Remove components
- Empty state message when no components exist

**UI Layout**:
```
┌─────────────────────────────────────────────────────┐
│ Event Components                    [+ Add Component]│
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Component Name *         Price (optional)       │ │
│ │ [Lift Ticket        ]    [$250.00]              │ │
│ │                                                   │ │
│ │ Capacity (optional)    [ ] Required  [Remove]   │ │
│ │ [20              ]                               │ │
│ │                                                   │ │
│ │ Description (optional)                           │ │
│ │ [3-day all-mountain access           ]          │ │
│ └─────────────────────────────────────────────────┘ │
│ [More components...]                                 │
└─────────────────────────────────────────────────────┘
```

### Form Submission
When publishing the event, components are included in the API call:

```typescript
const result = await createEventAction({
  title: formData.title,
  // ... other fields
  category: formData.category,
  components: formData.eventComponents.map(comp => ({
    name: comp.name,
    description: comp.description,
    price: comp.price,
    capacity: comp.capacity,
    is_required: comp.is_required,
    display_order: comp.display_order,
  })),
});
```

## User Experience Flow

### Creating an Event with Components

1. **Step 1: Select Category**
   - User selects "Ski & Snow"
   - System automatically loads 7 default components (Lift Ticket, Ski Rental, etc.)
   - User sees confirmation message

2. **Steps 2-3: Configure Event**
   - User fills out schedule, location, capacity, etc.
   - Components remain in the background

3. **Step 4: Customize Components**
   - User scrolls to "Event Components" section
   - Default components are pre-filled with suggested prices
   - User can:
     - Edit prices (e.g., change Lift Ticket from $89 to $120)
     - Mark components as required/optional
     - Add capacity limits
     - Add descriptions
     - Remove unwanted components
     - Add custom components

4. **Step 5-6: Finalize and Publish**
   - User completes safety policies
   - Reviews all details
   - Publishes event
   - Components are created in database

### Attendee Registration Flow (Future)
When attendees register for the event, they will:
1. See event details with all components listed
2. Select which optional components they want
3. Required components are automatically included
4. See total price calculation
5. Complete registration

## Benefits

### For Event Creators
- ✅ **Time-saving**: Default templates auto-populate common components
- ✅ **Flexibility**: Full customization of components
- ✅ **Capacity Control**: Set limits for rentals or limited resources
- ✅ **Pricing Options**: Components can be free, priced, or null (TBD)
- ✅ **Organization**: Clear breakdown of what's included

### For Attendees
- ✅ **Transparency**: Clear view of all event costs
- ✅ **Choice**: Select only the components they need
- ✅ **Clarity**: Know exactly what's included vs. optional

### Technical Benefits
- ✅ **Scalable**: Easy to add new categories and templates
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Secure**: Row Level Security policies
- ✅ **Performant**: Batch inserts for multiple components
- ✅ **Maintainable**: Clean separation of concerns

## Database Relationships

```
users
  └── events (one user can create many events)
        ├── event_components (one event can have many components)
        └── registrations (future: many attendees)
              └── registration_components (future: track which components each attendee selected)

component_templates (standalone, used as defaults)
```

## Future Enhancements

### Short-term
- [ ] Event registration system with component selection
- [ ] Track `current_registrations` when attendees sign up
- [ ] Prevent over-capacity registrations
- [ ] Component availability status (sold out indicator)

### Medium-term
- [ ] Component variants (e.g., Adult vs Child pricing)
- [ ] Component dependencies (e.g., "Lesson" requires "Equipment")
- [ ] Bundle discounts (e.g., "Lift + Rental" package)
- [ ] Waiting list for sold-out components

### Long-term
- [ ] Dynamic pricing based on demand
- [ ] Component-specific refund policies
- [ ] Integration with inventory management
- [ ] Multi-day component scheduling

## Testing

### Test the Database
```sql
-- Create an event with components
INSERT INTO events (user_id, title, start_date, category) VALUES
  ('user-uuid', 'Test Ski Trip', '2024-12-01', 'ski-snow')
  RETURNING id;

-- Add components
INSERT INTO event_components (event_id, name, price, is_required) VALUES
  ('event-uuid', 'Lift Ticket', 89.00, true),
  ('event-uuid', 'Equipment Rental', 45.00, false);

-- Query components
SELECT * FROM event_components WHERE event_id = 'event-uuid';
```

### Test the UI
1. Start the app: `bun dev:app`
2. Navigate to `/community/meetups/create`
3. Select category "Ski & Snow"
4. Verify default components load
5. Edit component details
6. Add a custom component
7. Remove a component
8. Publish event
9. Verify components saved in database

## Files Modified/Created

### New Files:
- `apps/api/supabase/migrations/20251028120000_create_event_components_table.sql` - Migration
- `EVENT_COMPONENTS_SUMMARY.md` - This documentation

### Modified Files:
- `packages/supabase/src/queries/index.ts` - Added component queries
- `packages/supabase/src/mutations/index.ts` - Added component mutations
- `packages/supabase/src/types/db.ts` - Regenerated with new tables
- `apps/app/src/actions/event/schema.ts` - Added component schema
- `apps/app/src/actions/event/create-event-action.ts` - Added component creation
- `apps/app/src/app/(default)/community/meetups/create/create-event-wizard.tsx` - Added UI

## Related Documentation
- `USER_AUTH_SETUP.md` - User authentication system
- `AUTH_ACTIONS_SUMMARY.md` - Authentication actions
- `EVENTS_API_SUMMARY.md` - Events API documentation
