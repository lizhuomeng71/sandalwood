-- Create events table
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text,
  start_date timestamptz not null,
  end_date timestamptz,
  location text,
  capacity integer,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- Constraints
  constraint valid_dates check (end_date is null or end_date >= start_date),
  constraint valid_capacity check (capacity is null or capacity > 0)
);

-- Create index on user_id for faster queries
create index if not exists events_user_id_idx on public.events(user_id);

-- Create index on start_date for date-based queries
create index if not exists events_start_date_idx on public.events(start_date);

-- Enable Row Level Security
alter table public.events enable row level security;

-- RLS Policies
-- Allow authenticated users to read all events
create policy "Users can view all events"
  on public.events
  for select
  to authenticated
  using (true);

-- Allow users to insert their own events
create policy "Users can create their own events"
  on public.events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Allow users to update their own events
create policy "Users can update their own events"
  on public.events
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow users to delete their own events
create policy "Users can delete their own events"
  on public.events
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create trigger to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_events_updated_at
  before update on public.events
  for each row
  execute function public.handle_updated_at();
