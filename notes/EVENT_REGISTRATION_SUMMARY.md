# Event Registration System - Complete Implementation

## Overview
Users can now register for events, select components (tickets, rentals, meals, etc.), and complete checkout. The system tracks registrations, manages component capacity, and prevents over-booking. Payment processing is a placeholder for now.

## Database Schema

### event_registrations Table
**Location**: `apps/api/supabase/migrations/20251028130000_create_registrations_table.sql`

**Schema**:
```sql
CREATE TABLE public.event_registrations (
    id uuid PRIMARY KEY,
    event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending',
    total_amount numeric(10, 2) NOT NULL DEFAULT 0,
    payment_status text NOT NULL DEFAULT 'unpaid',
    payment_intent_id text,
    notes text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    UNIQUE (event_id, user_id)
);
```

**Fields**:
- `event_id` - Foreign key to events table
- `user_id` - Foreign key to users table
- `status` - `pending`, `confirmed`, `cancelled`, or `waitlist`
- `total_amount` - Total registration cost
- `payment_status` - `unpaid`, `paid`, `refunded`, or `partial`
- `payment_intent_id` - Payment processor reference (for future Stripe integration)
- `notes` - User notes (dietary restrictions, special requests, etc.)

**Constraints**:
- One registration per user per event (unique constraint)
- Status must be one of the valid values
- Total amount must be >= 0
- Auto-updates `updated_at` timestamp

**Row Level Security**:
- ✅ Users can view their own registrations
- ✅ Event owners can view all registrations for their events
- ✅ Users can create registrations for themselves
- ✅ Users can update their own registrations
- ✅ Event owners can update registrations for their events

### registration_components Table
**Junction table linking registrations to event components**

**Schema**:
```sql
CREATE TABLE public.registration_components (
    id uuid PRIMARY KEY,
    registration_id uuid NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
    component_id uuid NOT NULL REFERENCES event_components(id) ON DELETE CASCADE,
    quantity integer NOT NULL DEFAULT 1,
    price_at_registration numeric(10, 2) NOT NULL,
    created_at timestamp with time zone,
    UNIQUE (registration_id, component_id)
);
```

**Fields**:
- `registration_id` - Which registration this component belongs to
- `component_id` - Which component was selected
- `quantity` - How many units (default 1)
- `price_at_registration` - Price locked in at registration time (protects against price changes)

**Constraints**:
- Quantity must be positive
- Price must be >= 0
- One entry per registration-component pair

**Automatic Features**:
1. **Capacity Management** - Triggers prevent over-capacity registrations
2. **Registration Count Tracking** - Automatically updates `event_components.current_registrations`
3. **Price Locking** - Stores price at time of registration

### registration_details View
**Convenient view combining registration data**

```sql
CREATE VIEW public.registration_details AS
SELECT
    er.*,
    e.title as event_title,
    e.start_date as event_start_date,
    u.email as user_email,
    u.full_name as user_name,
    json_agg(...) as components
FROM event_registrations er
JOIN events e ON e.id = er.event_id
JOIN users u ON u.id = er.user_id
LEFT JOIN registration_components rc ON rc.registration_id = er.id
GROUP BY er.id, ...
```

## Database Triggers

### 1. Capacity Checking
**Function**: `check_component_capacity()`

Prevents registrations that would exceed component capacity:
```sql
-- Before INSERT/UPDATE on registration_components
-- Checks if (current_registrations + quantity) > capacity
-- Raises exception if exceeded
```

### 2. Registration Count Updates
**Function**: `update_component_registrations()`

Automatically maintains accurate registration counts:
```sql
-- After INSERT/UPDATE/DELETE on registration_components
-- Updates event_components.current_registrations
-- Handles quantity changes
```

## API Implementation

### Queries
**Location**: `packages/supabase/src/queries/index.ts`

```typescript
// Get event with all components
export async function getEventWithComponents(eventId: string)

// Get all registrations for an event (event owner only)
export async function getEventRegistrations(eventId: string)

// Get user's registration history
export async function getUserRegistrations(userId: string)

// Get single registration details
export async function getRegistration(registrationId: string)

// Check if user is already registered
export async function checkUserRegistration(eventId: string, userId: string)
```

### Mutations
**Location**: `packages/supabase/src/mutations/index.ts`

```typescript
// Create a registration
export async function createRegistration(data: TablesInsert<"event_registrations">)

// Create registration components (batch)
export async function createRegistrationComponents(components: TablesInsert<"registration_components">[])

// Update registration
export async function updateRegistration(registrationId: string, data: TablesUpdate<"event_registrations">)

// Cancel registration
export async function cancelRegistration(registrationId: string)
```

## Server Actions

### Register for Event Action
**Location**: `apps/app/src/actions/registration/register-action.ts`

**Schema**:
```typescript
export const registerForEventSchema = z.object({
  event_id: z.string().uuid(),
  selected_components: z.array(z.object({
    component_id: z.string().uuid(),
    quantity: z.number().int().positive().default(1),
    price: z.number().nullable(),
  })),
  notes: z.string().optional(),
});
```

**Flow**:
1. Validates user is authenticated
2. Calculates total amount from selected components
3. Creates registration record
4. Creates registration_components records
5. Returns registration with components

**Usage**:
```typescript
import { registerForEventAction } from "@/actions/registration";

const result = await registerForEventAction({
  event_id: "event-uuid",
  selected_components: [
    { component_id: "lift-ticket-uuid", quantity: 1, price: 89.00 },
    { component_id: "rental-uuid", quantity: 1, price: 45.00 },
  ],
  notes: "Vegetarian meal preference",
});
```

**Features**:
- ✅ Automatic total calculation
- ✅ Analytics tracking
- ✅ Price locking at registration time
- ✅ Batch component creation
- ✅ Error handling with rollback

### Cancel Registration Action
**Location**: `apps/app/src/actions/registration/cancel-action.ts`

**Schema**:
```typescript
export const cancelRegistrationSchema = z.object({
  registration_id: z.string().uuid(),
});
```

**Usage**:
```typescript
import { cancelRegistrationAction } from "@/actions/registration";

const result = await cancelRegistrationAction({
  registration_id: "registration-uuid",
});
```

## Frontend Implementation

### Event Detail Page
**Location**: `apps/app/src/app/(default)/community/meetups/[id]/page.tsx`

**Features**:
- Event information display
- Component list with pricing
- Registration status check
- "Register Now" button (or "Sign in to Register")
- Success message after registration
- Starting price calculation (required components only)

**URL**: `/community/meetups/[event-id]`

**Example**: `/community/meetups/abc123`

### Event Registration Page
**Location**: `apps/app/src/app/(default)/community/meetups/[id]/register/page.tsx`

**Server-side checks**:
- Fetches event with components
- Checks if user is authenticated (redirects to signin if not)
- Checks if user already registered (redirects if already registered)
- Passes data to client component

**URL**: `/community/meetups/[event-id]/register`

### Registration Form Component
**Location**: `apps/app/src/app/(default)/community/meetups/[id]/register/register-form.tsx`

**Features**:

#### Component Selection
- Checkbox for each component
- Required components are pre-selected and disabled
- Optional components can be toggled
- Quantity selector for each selected component
- Sold out indicator for at-capacity components
- Price display per component
- Component descriptions

#### Price Calculation
- Real-time total calculation
- Per-component subtotals (price × quantity)
- Summary sidebar with line items
- Grand total display

#### User Experience
- Auto-select required components
- Prevent deselection of required components
- Capacity checking (sold out badge)
- Quantity validation (min 1)
- Additional notes field
- Error handling with user-friendly messages
- Loading state during submission

#### Layout
- Two-column layout (form + sidebar)
- Sticky summary sidebar
- Mobile-responsive grid
- Event details card
- User info card
- Component selection cards

## User Flow

### Complete Registration Flow

1. **Browse Events**
   - User visits `/community/meetups`
   - Browses available events
   - Clicks on event to see details

2. **View Event Details**
   - `/community/meetups/[id]`
   - Sees event info, components, pricing
   - Checks if already registered
   - Clicks "Register Now"

3. **Sign In (if needed)**
   - Redirected to `/signin?redirect=/community/meetups/[id]/register`
   - Signs in or creates account
   - Redirected back to registration page

4. **Select Components**
   - `/community/meetups/[id]/register`
   - Required components pre-selected
   - User selects optional components
   - Adjusts quantities if needed
   - Sees real-time price calculation

5. **Add Notes**
   - User adds special requests
   - Dietary restrictions, accessibility needs, etc.

6. **Review Summary**
   - Reviews selected components
   - Checks total price
   - Verifies all details

7. **Complete Registration**
   - Clicks "Complete Registration"
   - System validates capacity
   - Creates registration + components
   - **Payment step (placeholder for now)**

8. **Confirmation**
   - Redirected to event page with success message
   - `/community/meetups/[id]?registered=true`
   - Shows "You're registered" status

## Capacity Management

### Automatic Enforcement
The system automatically prevents over-capacity registrations:

```sql
-- Before inserting registration_components
-- Check: (current_registrations + new_quantity) <= capacity
-- If exceeded: RAISE EXCEPTION
```

**Example**:
- Component capacity: 20
- Current registrations: 18
- User tries to register with quantity 3
- **Result**: ❌ Error "Component capacity exceeded. Available: 2, Requested: 3"

### UI Indicators
- Sold out badge when `current_registrations >= capacity`
- "X / Y spots taken" progress indicator
- Disabled checkboxes for sold-out components

### Registration Count Tracking
Automatically maintained via triggers:
- INSERT → increment by quantity
- UPDATE → adjust by difference
- DELETE → decrement by quantity

## Payment Integration (Placeholder)

### Current State
Payment processing is left as a placeholder. The registration form shows:
```
"Payment will be processed in the next step."
```

### For Future Implementation
The database is ready for payment integration:

**Fields prepared**:
- `payment_status`: `unpaid`, `paid`, `refunded`, `partial`
- `payment_intent_id`: Store Stripe/payment processor ID
- `total_amount`: Locked-in total price

**Suggested flow**:
1. User selects components → calculates total
2. User clicks "Complete Registration"
3. Registration created with `payment_status: 'unpaid'`
4. Redirect to payment page
5. Process payment with Stripe/processor
6. Update `payment_status: 'paid'` and `payment_intent_id`
7. Send confirmation email

**Integration points**:
```typescript
// In register-action.ts, add after registration:
if (totalAmount > 0) {
  // Create Stripe Payment Intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount * 100, // cents
    currency: 'usd',
    metadata: { registration_id: registration.id }
  });

  // Update registration with payment intent ID
  await updateRegistration(registration.id, {
    payment_intent_id: paymentIntent.id
  });

  return {
    registration,
    payment_client_secret: paymentIntent.client_secret
  };
}
```

## Security Features

### Row Level Security (RLS)
All tables have comprehensive RLS policies:

**event_registrations**:
- Users can only see their own registrations
- Event owners can see all registrations for their events
- Users can only create/update their own registrations
- Event owners can update registrations for their events

**registration_components**:
- Users can only see components for their own registrations
- Event owners can see components for their event registrations
- Users can only create components for their own registrations

### Data Integrity
- Foreign key constraints with cascade delete
- Unique constraint prevents duplicate registrations
- Check constraints on status and payment_status
- Triggers prevent capacity violations
- Price locking prevents pricing manipulation

## Error Handling

### Common Errors

**1. Capacity Exceeded**
```
Error: Component capacity exceeded. Available: 2, Requested: 3
```
**Solution**: User must select fewer quantity or choose different component

**2. Already Registered**
```
Error: duplicate key value violates unique constraint "event_registrations_unique_user_event"
```
**Solution**: Automatic redirect if already registered (handled in page.tsx)

**3. Not Authenticated**
```
Error: User not authenticated
```
**Solution**: Automatic redirect to signin page (handled in page.tsx)

**4. Event Not Found**
```
404 Not Found
```
**Solution**: Show not found page

## Testing

### Test the Complete Flow

1. **Create an Event** (as event organizer)
```bash
# Navigate to create event page
http://localhost:3000/community/meetups/create

# Steps:
# 1. Fill out event details
# 2. Select "Ski & Snow" category
# 3. Customize components (set prices, capacities)
# 4. Publish event
```

2. **View Event** (as attendee)
```bash
# Navigate to event detail page
http://localhost:3000/community/meetups/[event-id]

# Should see:
# - Event details
# - Component list
# - "Register Now" button
```

3. **Register for Event**
```bash
# Click "Register Now"
# Should redirect to:
http://localhost:3000/community/meetups/[event-id]/register

# Steps:
# 1. Select optional components
# 2. Adjust quantities
# 3. Add notes
# 4. Review summary
# 5. Click "Complete Registration"
# 6. Verify redirect to confirmation
```

4. **Verify Registration**
```sql
-- Check registration created
SELECT * FROM event_registrations WHERE user_id = 'user-uuid';

-- Check components selected
SELECT * FROM registration_components WHERE registration_id = 'registration-uuid';

-- Check registration counts updated
SELECT name, capacity, current_registrations
FROM event_components
WHERE event_id = 'event-uuid';
```

### Test Capacity Limits

1. Create component with capacity = 2
2. Register user 1 with quantity = 1 → ✅ Success (1/2)
3. Register user 2 with quantity = 1 → ✅ Success (2/2)
4. Register user 3 with quantity = 1 → ❌ Error (sold out)

### Test Price Locking

1. Create component with price = $50
2. User registers → `price_at_registration` = $50
3. Event owner changes component price to $75
4. User's registration still shows $50 ✅

## Database Relationships

```
users
  └── event_registrations (many registrations per user)
        ├── registration_components (many components per registration)
        │     └── event_components (reference)
        └── events (reference)

events
  ├── event_registrations (many registrations per event)
  └── event_components (many components per event)
        └── registration_components (track selections)
```

## Analytics & Tracking

Registration actions include automatic analytics tracking:

```typescript
track: {
  event: "Event Registration Created",
  channel: "events",
}
```

**Tracked events**:
- Event Registration Created
- Event Registration Cancelled

**Useful metrics** (can be queried):
- Total registrations per event
- Revenue per event (`SUM(total_amount)`)
- Most popular components
- Conversion rate (views → registrations)
- Average order value
- Component capacity utilization

## Future Enhancements

### Short-term
- [ ] Email confirmation on registration
- [ ] QR code ticket generation
- [ ] Registration confirmation page
- [ ] Edit registration (change components)
- [ ] Waitlist functionality when sold out
- [ ] Refund management

### Medium-term
- [ ] Stripe payment integration
- [ ] PDF ticket generation
- [ ] Calendar export (.ics)
- [ ] Registration reminders
- [ ] Check-in system (for event day)
- [ ] Attendee list (for event owners)

### Long-term
- [ ] Group registrations (register multiple people)
- [ ] Promo codes / discounts
- [ ] Early bird pricing
- [ ] Tiered pricing based on date
- [ ] Recurring events with series registration
- [ ] Social sharing (invite friends)

## Files Created/Modified

### New Files:
- `apps/api/supabase/migrations/20251028130000_create_registrations_table.sql` - Migration
- `apps/app/src/actions/registration/schema.ts` - Zod schemas
- `apps/app/src/actions/registration/register-action.ts` - Register action
- `apps/app/src/actions/registration/cancel-action.ts` - Cancel action
- `apps/app/src/actions/registration/index.ts` - Barrel export
- `apps/app/src/app/(default)/community/meetups/[id]/page.tsx` - Event detail page
- `apps/app/src/app/(default)/community/meetups/[id]/register/page.tsx` - Registration page (server)
- `apps/app/src/app/(default)/community/meetups/[id]/register/register-form.tsx` - Registration form (client)
- `EVENT_REGISTRATION_SUMMARY.md` - This documentation

### Modified Files:
- `packages/supabase/src/queries/index.ts` - Added registration queries
- `packages/supabase/src/mutations/index.ts` - Added registration mutations
- `packages/supabase/src/types/db.ts` - Regenerated with new tables

## Related Documentation
- `USER_AUTH_SETUP.md` - User authentication system
- `EVENT_COMPONENTS_SUMMARY.md` - Event components system
- `EVENTS_API_SUMMARY.md` - Events API documentation

---

## Quick Start

### Register for an Event (User)
1. Browse events at `/community/meetups`
2. Click event to view details
3. Click "Register Now"
4. Select components you want
5. Complete registration
6. Done! You're registered

### View Registrations (Event Owner)
```typescript
import { getEventRegistrations } from '@v1/supabase/queries'

const { data: registrations } = await getEventRegistrations(eventId)
console.log(`${registrations.length} people registered`)
```

### Create Registration Programmatically
```typescript
import { registerForEventAction } from '@/actions/registration'

await registerForEventAction({
  event_id: 'event-uuid',
  selected_components: [
    { component_id: 'comp1', quantity: 1, price: 89.00 },
    { component_id: 'comp2', quantity: 2, price: 25.00 },
  ],
  notes: 'Looking forward to it!'
})
```

The registration system is complete and ready to use! 🎉
