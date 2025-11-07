# Testing User Creation Flow

## Test Script

To verify that the user creation trigger works correctly, follow these steps:

### 1. Start Supabase
```bash
cd apps/api
bunx supabase start
```

### 2. Open Supabase Studio
The local studio should be available at: http://localhost:54323

### 3. Test via SQL Editor

Open the SQL Editor in Supabase Studio and run:

```sql
-- Check if the trigger and function exist
SELECT
    tgname as trigger_name,
    proname as function_name,
    tgenabled as trigger_enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- If the above returns no results, the trigger is not set up
-- Re-run migrations:
-- bunx supabase db reset --local
```

### 4. Check Current Users

```sql
-- Check auth.users
SELECT id, email, created_at FROM auth.users;

-- Check public.users
SELECT id, email, full_name, created_at FROM public.users;
```

### 5. Create a Test User via Supabase Auth

You can create a test user in multiple ways:

#### Option A: Via Supabase Studio UI
1. Go to Authentication > Users in the Supabase Studio
2. Click "Add User"
3. Fill in email and password
4. Add metadata for full_name: `{"full_name": "Test User"}`
5. Click "Create User"

#### Option B: Via API call

```bash
curl 'http://localhost:54321/auth/v1/signup' \
  -H 'Content-Type: application/json' \
  -H 'apikey: YOUR_ANON_KEY' \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "data": {
      "full_name": "Test User"
    }
  }'
```

#### Option C: Via the signup page
1. Start the app: `bun dev:app`
2. Navigate to `/signup`
3. Fill out and submit the form (after implementing the signup action)

### 6. Verify User Creation

After creating a user, run these queries to verify:

```sql
-- Check that user exists in auth.users
SELECT id, email, raw_user_meta_data, created_at
FROM auth.users
WHERE email = 'test@example.com';

-- Check that user was automatically created in public.users
SELECT id, email, full_name, created_at
FROM public.users
WHERE email = 'test@example.com';

-- Verify that IDs match
SELECT
    au.id as auth_user_id,
    au.email as auth_email,
    pu.id as public_user_id,
    pu.email as public_email,
    pu.full_name
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'test@example.com';
```

### Expected Results

If the trigger is working correctly:
- ✅ User exists in `auth.users` with the email
- ✅ User exists in `public.users` with the same ID
- ✅ `full_name` is populated from `raw_user_meta_data`
- ✅ `created_at` timestamps are similar

### Common Issues

#### User created in auth.users but NOT in public.users

**Possible causes:**
1. Trigger is not enabled
2. Function has an error
3. RLS policies are too restrictive

**Solutions:**
```sql
-- Re-enable trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Check function for errors
SELECT public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, service_role;
```

#### Error: "function public.handle_new_user() does not exist"

**Solution:**
```bash
cd apps/api
bunx supabase db reset --local
```

This will reapply all migrations including the trigger setup.

### Cleanup Test Data

After testing, clean up test users:

```sql
-- Delete test user (cascades to public.users due to foreign key)
DELETE FROM auth.users WHERE email = 'test@example.com';

-- Verify deletion
SELECT COUNT(*) FROM public.users WHERE email = 'test@example.com';
-- Should return 0
```

## Integration Testing

### Create a Test File

Create `apps/api/test-user-creation.sql`:

```sql
-- Test user creation trigger
BEGIN;

-- Create a test user
DO $$
DECLARE
    test_user_id uuid := gen_random_uuid();
    test_email text := 'trigger-test-' || gen_random_uuid() || '@example.com';
BEGIN
    -- Insert into auth.users (simulating signup)
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        raw_app_meta_data,
        aud,
        role
    ) VALUES (
        test_user_id,
        '00000000-0000-0000-0000-000000000000',
        test_email,
        crypt('testpassword', gen_salt('bf')),
        now(),
        '{"full_name": "Trigger Test User"}'::jsonb,
        '{}'::jsonb,
        'authenticated',
        'authenticated'
    );

    -- Check if user was created in public.users
    IF EXISTS (
        SELECT 1 FROM public.users
        WHERE id = test_user_id
        AND email = test_email
        AND full_name = 'Trigger Test User'
    ) THEN
        RAISE NOTICE '✅ SUCCESS: User was automatically created in public.users';
        RAISE NOTICE 'User ID: %', test_user_id;
        RAISE NOTICE 'Email: %', test_email;
    ELSE
        RAISE EXCEPTION '❌ FAILURE: User was NOT created in public.users';
    END IF;

    -- Cleanup
    DELETE FROM auth.users WHERE id = test_user_id;
END $$;

ROLLBACK; -- Don't actually commit, this is just a test
```

Run it:
```bash
cd apps/api
bunx supabase db execute --file test-user-creation.sql --local
```
