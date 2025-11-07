# Authentication Actions Summary

## Overview
This document describes the authentication server actions that have been created for user signup, signin, and signout.

## Server Actions Created

### 1. Sign Up Action
**Location**: `apps/app/src/actions/auth/signup-action.ts`

**Purpose**: Creates a new user account in Supabase Auth and automatically creates a user profile in the database.

**Schema**:
```typescript
{
  email: string (valid email),
  password: string (min 8 characters),
  full_name: string (required)
}
```

**Features**:
- ✅ Email and password validation with Zod
- ✅ Stores full_name in user metadata
- ✅ Automatically triggers `handle_new_user()` function to create profile in `public.users`
- ✅ Analytics tracking (event: "User Signed Up", channel: "auth")
- ✅ Returns success message with user data

**Usage**:
```typescript
import { signUpAction } from "@/actions/auth";

const result = await signUpAction({
  email: "user@example.com",
  password: "securepassword123",
  full_name: "John Doe",
});

if (result?.data) {
  console.log(result.data.message); // "Account created successfully!"
}
```

**Flow**:
1. User submits signup form
2. `signUpAction` validates input
3. Calls `supabase.auth.signUp()` with email, password, and metadata
4. Supabase Auth creates user in `auth.users`
5. `on_auth_user_created` trigger fires automatically
6. `handle_new_user()` function creates profile in `public.users`
7. User receives confirmation (if email confirmation is enabled)

### 2. Sign In Action
**Location**: `apps/app/src/actions/auth/signin-action.ts`

**Purpose**: Authenticates an existing user with email and password.

**Schema**:
```typescript
{
  email: string (valid email),
  password: string (required)
}
```

**Features**:
- ✅ Email and password validation
- ✅ Analytics tracking (event: "User Signed In", channel: "auth")
- ✅ Returns success message with user data
- ✅ Creates session cookie automatically

**Usage**:
```typescript
import { signInAction } from "@/actions/auth";

const result = await signInAction({
  email: "user@example.com",
  password: "securepassword123",
});

if (result?.data) {
  console.log(result.data.message); // "Signed in successfully!"
  // User is now authenticated
}
```

### 3. Sign Out Action
**Location**: `apps/app/src/actions/auth/signout-action.ts`

**Purpose**: Signs out the current user and clears their session.

**Schema**:
```typescript
{} // No input required
```

**Features**:
- ✅ Analytics tracking (event: "User Signed Out", channel: "auth")
- ✅ Clears session cookie
- ✅ Returns success message

**Usage**:
```typescript
import { signOutAction } from "@/actions/auth";

const result = await signOutAction({});

if (result?.data) {
  console.log(result.data.message); // "Signed out successfully!"
  // User is now signed out
}
```

## Schema Definitions
**Location**: `apps/app/src/actions/auth/schema.ts`

All schemas use Zod for validation:

```typescript
export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(1, "Full name is required"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signOutSchema = z.object({});
```

## Integration with Frontend

### Example: Sign Up Form Component

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUpAction } from "@/actions/auth";

export function SignUpForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const result = await signUpAction({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      full_name: formData.get("full_name") as string,
    });

    if (result?.serverError) {
      setError(result.serverError);
      setIsSubmitting(false);
      return;
    }

    if (result?.data) {
      // Success! Redirect to dashboard or show success message
      router.push("/dashboard");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}

      <input
        type="email"
        name="email"
        placeholder="Email"
        required
      />

      <input
        type="text"
        name="full_name"
        placeholder="Full Name"
        required
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        required
        minLength={8}
      />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Sign Up"}
      </button>
    </form>
  );
}
```

### Example: Sign In Form Component

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInAction } from "@/actions/auth";

export function SignInForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const result = await signInAction({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    if (result?.serverError) {
      setError(result.serverError);
      setIsSubmitting(false);
      return;
    }

    if (result?.data) {
      router.push("/dashboard");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}

      <input
        type="email"
        name="email"
        placeholder="Email"
        required
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        required
      />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
```

### Example: Sign Out Button

```tsx
"use client";

import { signOutAction } from "@/actions/auth";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const result = await signOutAction({});

    if (result?.data) {
      router.push("/signin");
    }
  }

  return (
    <button onClick={handleSignOut}>
      Sign Out
    </button>
  );
}
```

## User Profile Queries

Along with the auth actions, user profile query functions have been added:

**Location**: `packages/supabase/src/queries/index.ts`

```typescript
// Get any user's profile by ID
export async function getUserProfile(userId: string)

// Get the current authenticated user's profile
export async function getCurrentUserProfile()
```

**Usage**:
```typescript
import { getCurrentUserProfile, getUserProfile } from "@v1/supabase/queries";

// Get current user's profile
const { data: profile } = await getCurrentUserProfile();
console.log(profile.full_name, profile.email);

// Get specific user's profile
const { data: otherProfile } = await getUserProfile("user-uuid-here");
```

## Security Features

All auth actions include:
- ✅ **Input validation** with Zod schemas
- ✅ **Rate limiting** via Upstash KV (inherited from `actionClientWithMeta`)
- ✅ **Analytics tracking** for user behavior
- ✅ **Sentry error monitoring** (inherited from `actionClientWithMeta`)
- ✅ **Automatic session management** via Supabase

## Testing

See `TEST_USER_CREATION.md` for detailed testing instructions.

Quick test:
```bash
# Start Supabase
cd apps/api && bunx supabase start

# Start app
bun dev:app

# Navigate to /signup and create an account
# Check that user exists in both auth.users and public.users
```

## Next Steps

1. **Update the signup page** at `apps/app/src/app/(auth)/signup/page.tsx` to use `signUpAction`
2. **Update the signin page** at `apps/app/src/app/(auth)/signin/page.tsx` to use `signInAction`
3. **Add sign out functionality** to the app header/navigation
4. **Configure email confirmation** settings in Supabase (optional)
5. **Add password reset functionality** (optional)
6. **Add OAuth providers** (Google, GitHub, etc.) (optional)

## Files Created/Modified

### New Files:
- `apps/app/src/actions/auth/schema.ts` - Zod schemas for auth
- `apps/app/src/actions/auth/signup-action.ts` - Sign up server action
- `apps/app/src/actions/auth/signin-action.ts` - Sign in server action
- `apps/app/src/actions/auth/signout-action.ts` - Sign out server action
- `apps/app/src/actions/auth/index.ts` - Barrel export

### Modified Files:
- `packages/supabase/src/queries/index.ts` - Added `getUserProfile()` and `getCurrentUserProfile()`

### Existing Files (Already Set Up):
- `apps/api/supabase/migrations/20240901155537_create_auth_users_triggers.sql` - Trigger setup
- `apps/api/supabase/migrations/20240901155538_create_users_table.sql` - Users table
- `apps/api/supabase/functions/send-email/index.ts` - Welcome email on signup

## Related Documentation

- `USER_AUTH_SETUP.md` - Complete user authentication and database setup guide
- `TEST_USER_CREATION.md` - Testing instructions for user creation flow
- `EVENTS_API_SUMMARY.md` - Events API documentation (uses user authentication)
