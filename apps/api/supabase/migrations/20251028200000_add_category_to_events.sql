-- Add category column to events table
alter table public.events
add column if not exists category text;

-- Create index on category for filtering
create index if not exists events_category_idx on public.events(category);
