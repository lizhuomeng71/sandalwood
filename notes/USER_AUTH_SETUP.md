# User Authentication & Database Setup

## Overview
This document describes the user authentication setup with Supabase, including automatic user profile creation when users sign up.

## Database Setup

### Users Table
**Location**: `apps/api/supabase/migrations/20240901155538_create_users_table.sql`

**Schema**:
```sql
CREATE TABLE public.users (
    id uuid PRIMARY KEY,
    email text UNIQUE NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk_auth_user FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);
```

**Features**:
- ✅ Row Level Security (RLS) enabled
- ✅ Users can read their own profile
- ✅ Users can update their own profile
- ✅ Automatic `updated_at` timestamp on updates
- ✅ Foreign key to `auth.users` with cascade delete

**Policies**:
- `select_own_profile`: Users can SELECT their own profile using `auth.uid() = id`
- `update_own_profile`: Users can UPDATE their own profile using `auth.uid() = id`

### Auto-Create User Trigger
**Location**: `apps/api/supabase/migrations/20240901155537_create_auth_users_triggers.sql`

**Function**: `public.handle_new_user()`
```sql
CREATE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data ->> 'full_name'
    );
    RETURN new;
END;
$$;
```

**Trigger**: `on_auth_user_created`
```sql
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
```

**How It Works**:
1. User signs up via Supabase Auth (e.g., using email/password, OAuth, etc.)
2. A new record is created in `auth.users` table (managed by Supabase)
3. The `on_auth_user_created` trigger fires automatically
4. The `handle_new_user()` function runs and creates a corresponding record in `public.users`
5. User profile data is extracted from `raw_user_meta_data` (full_name)

## Email Notifications

### Welcome Email Edge Function
**Location**: `apps/api/supabase/functions/send-email/index.ts`

**Features**:
- Sends welcome email on signup using Resend
- Uses React Email templates (`@v1/emails/welcome`)
- Webhook-based trigger from Supabase Auth
- Supports multiple email action types (signup, reset_password, magic_link, etc.)

**Environment Variables Required**:
- `RESEND_API_KEY`: Your Resend API key
- `SEND_EMAIL_HOOK_SECRET`: Webhook verification secret

## Sign Up Flow

### Complete User Registration Flow
1. **User submits signup form** with email, password, and optional full_name
2. **Supabase Auth creates user** in `auth.users` table
3. **Trigger fires** → `public.users` entry is created automatically
4. **Email webhook fires** → Welcome email is sent via edge function
5. **User receives confirmation email** (if email confirmation is enabled)
6. **User can log in** and their profile is available in `public.users`

## Testing the Setup

### 1. Start Supabase locally
```bash
cd apps/api
bunx supabase start
```

### 2. Apply migrations (if not already applied)
```bash
bunx supabase db reset --local
```

### 3. Test user creation
You can test the flow in two ways:

#### Option A: Via the UI
1. Navigate to your signup page in the app
2. Fill out the signup form
3. Check that a user is created in both `auth.users` and `public.users`

#### Option B: Via SQL
```sql
-- This simulates what happens when a user signs up
-- (In production, Supabase Auth handles this)
INSERT INTO auth.users (
  id,
  email,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'test@example.com',
  '{"full_name": "Test User"}'::jsonb
);

-- Check that the user was created in public.users
SELECT * FROM public.users WHERE email = 'test@example.com';
```

## Extending User Profiles

To add more fields to user profiles:

1. **Create a new migration**:
```bash
cd apps/api
bunx supabase migration new add_user_fields
```

2. **Add columns**:
```sql
ALTER TABLE public.users
ADD COLUMN phone_number text,
ADD COLUMN bio text,
ADD COLUMN website text;
```

3. **Update the trigger function** to extract additional fields from `raw_user_meta_data`:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, phone_number)
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'phone_number'
    );
    RETURN new;
END;
$$;
```

4. **Apply the migration**:
```bash
bunx supabase db reset --local
```

5. **Regenerate types**:
```bash
bunx supabase gen types --lang=typescript --local --schema public > ../../packages/supabase/src/types/db.ts
```

## Security Notes

- The `handle_new_user()` function runs with `SECURITY DEFINER`, meaning it executes with the privileges of the user who created it (typically the database owner)
- This is necessary because regular users don't have INSERT permissions on `public.users` during the signup process
- The function has `SET search_path = ''` to prevent SQL injection attacks via search_path manipulation
- RLS policies ensure users can only read/update their own profiles

## Troubleshooting

### User not created in public.users
1. Check if the trigger exists:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

2. Check if the function exists:
```sql
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
```

3. Check the function permissions:
```sql
SELECT * FROM information_schema.routine_privileges
WHERE routine_name = 'handle_new_user';
```

### Email not being sent
1. Verify edge function is deployed
2. Check environment variables are set
3. Check Supabase Auth webhook configuration
4. Check edge function logs for errors

## Related Files

- Users table: `apps/api/supabase/migrations/20240901155538_create_users_table.sql`
- Auth trigger: `apps/api/supabase/migrations/20240901155537_create_auth_users_triggers.sql`
- Email function: `apps/api/supabase/functions/send-email/index.ts`
- User types: `packages/supabase/src/types/db.ts`
- User queries: `packages/supabase/src/queries/index.ts`
- User mutations: `packages/supabase/src/mutations/index.ts`
