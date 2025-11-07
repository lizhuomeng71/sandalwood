# Standalone API Server

A standalone REST API server built with Next.js Route Handlers that can be called by both web and mobile applications.

## Features

- Built with Next.js 15 Route Handlers
- RESTful endpoints for events and registrations
- CORS enabled for web and mobile clients
- TypeScript support
- Hot reload in development
- Supabase integration
- Can be deployed separately from the main app

## Getting Started

### Prerequisites

- Bun installed
- Supabase running locally (or remote instance)

### Installation

From the monorepo root:
```bash
bun install
```

Or from the api directory:
```bash
cd apps/api
bun install
```

### Configuration

Create a `.env` or `.env.local` file and configure:

```env
# Supabase
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_KEY=your_service_key

# CORS - comma separated origins
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002
```

### Running the Server

Development mode (with hot reload):
```bash
bun run dev
```

Build for production:
```bash
bun run build
```

Production mode:
```bash
bun run start
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Health Check

- `GET /` - API info
- `GET /health` - Health check

### Events

- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/events/:id/components` - Get event components
- `POST /api/events/:id/components` - Add event component

### Registrations

- `GET /api/registrations` - Get all registrations
  - Query params: `event_id`, `user_id`
- `GET /api/registrations/:id` - Get single registration
- `POST /api/registrations` - Create registration
- `PUT /api/registrations/:id` - Update registration
- `DELETE /api/registrations/:id` - Cancel registration
- `GET /api/registrations/event/:eventId/count` - Get registration count

## Example Usage

### Create an Event

```bash
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Community Meetup",
    "description": "Monthly meetup",
    "start_time": "2025-11-01T18:00:00Z",
    "end_time": "2025-11-01T20:00:00Z",
    "location": "Downtown"
  }'
```

### Register for an Event

```bash
curl -X POST http://localhost:3001/api/registrations \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "event-uuid",
    "user_id": "user-uuid"
  }'
```

### Get All Events

```bash
curl http://localhost:3001/api/events
```

## Mobile App Integration

To use this API in your mobile app:

1. Ensure the API server is running
2. Update `ALLOWED_ORIGINS` in `.env` to include your mobile app's origin
3. Use the base URL `http://localhost:3001` for local testing
4. For production, deploy the API and use the production URL

Example mobile app configuration:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://localhost:3001'
  : 'https://api.yourdomain.com';

fetch(`${API_BASE_URL}/api/events`)
  .then(res => res.json())
  .then(data => console.log(data));
```

## Project Structure

```
apps/api/
├── app/
│   ├── api/
│   │   ├── events/
│   │   │   ├── route.ts                    # GET, POST /api/events
│   │   │   └── [id]/
│   │   │       ├── route.ts                # GET, PUT, DELETE /api/events/:id
│   │   │       └── components/
│   │   │           └── route.ts            # GET, POST /api/events/:id/components
│   │   ├── registrations/
│   │   │   ├── route.ts                    # GET, POST /api/registrations
│   │   │   ├── [id]/
│   │   │   │   └── route.ts                # GET, PUT, DELETE /api/registrations/:id
│   │   │   └── event/
│   │   │       └── [eventId]/
│   │   │           └── count/
│   │   │               └── route.ts        # GET count
│   │   └── health/
│   │       └── route.ts                    # Health check
│   ├── lib/
│   │   └── supabase.ts                     # Supabase client
│   └── page.tsx                            # Home page with API docs
├── supabase/                               # Supabase migrations and config
├── .env.local                              # Environment variables
├── next.config.js                          # Next.js configuration
├── package.json
└── tsconfig.json
```

## Supabase Management

### Start Supabase locally

```bash
bun run supabase:start
```

### Run migrations

```bash
bun run migrate
```

### Reset database

```bash
bun run reset
```

### Generate TypeScript types

```bash
bun run generate
```

## Deployment

The API can be deployed to any platform that supports Next.js:

- Vercel (recommended for Next.js)
- Railway
- Render
- Fly.io
- Any platform with Node.js or Bun support

Make sure to set environment variables in your deployment platform.

### Example Vercel Deployment

```bash
cd apps/api
vercel --prod
```

Set environment variables in Vercel dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `ALLOWED_ORIGINS`
