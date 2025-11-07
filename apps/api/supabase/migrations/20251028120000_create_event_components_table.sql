-- Create event_components table
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
    updated_at timestamp with time zone DEFAULT now(),

    CONSTRAINT event_components_capacity_check CHECK (capacity IS NULL OR capacity > 0),
    CONSTRAINT event_components_registrations_check CHECK (current_registrations >= 0),
    CONSTRAINT event_components_capacity_limit_check CHECK (capacity IS NULL OR current_registrations <= capacity)
);

-- Enable row level security (RLS)
ALTER TABLE public.event_components ENABLE ROW LEVEL SECURITY;

-- Create a trigger to update the updated_at column
CREATE TRIGGER event_components_updated_at
BEFORE UPDATE ON public.event_components
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Create index on event_id for faster queries
CREATE INDEX idx_event_components_event_id ON public.event_components(event_id);

-- Create index on display_order for sorting
CREATE INDEX idx_event_components_display_order ON public.event_components(event_id, display_order);

-- RLS Policies

-- Users can view components for any event
CREATE POLICY select_event_components ON public.event_components
FOR SELECT USING (true);

-- Users can only create components for their own events
CREATE POLICY insert_event_components ON public.event_components
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = event_components.event_id
        AND events.user_id = auth.uid()
    )
);

-- Users can only update components for their own events
CREATE POLICY update_event_components ON public.event_components
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = event_components.event_id
        AND events.user_id = auth.uid()
    )
);

-- Users can only delete components for their own events
CREATE POLICY delete_event_components ON public.event_components
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = event_components.event_id
        AND events.user_id = auth.uid()
    )
);

-- Create component_templates table for default templates
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

-- Enable RLS on component_templates (read-only for users)
ALTER TABLE public.component_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view templates
CREATE POLICY select_component_templates ON public.component_templates
FOR SELECT USING (true);

-- Insert default templates for common event categories
INSERT INTO public.component_templates (category, name, description, default_price, is_required, display_order) VALUES
-- Ski & Snow category
('ski-snow', 'Lift Ticket', 'Full-day lift access', 89.00, true, 1),
('ski-snow', 'Ski Rental', 'Skis, boots, and poles', 45.00, false, 2),
('ski-snow', 'Snowboard Rental', 'Board and boots', 45.00, false, 3),
('ski-snow', 'Helmet Rental', 'Safety helmet', 10.00, false, 4),
('ski-snow', 'Lesson', 'Group ski/snowboard lesson', 75.00, false, 5),
('ski-snow', 'Lunch', 'On-mountain dining', 25.00, false, 6),
('ski-snow', 'Transportation', 'Round-trip shuttle', 30.00, false, 7),

-- Outdoor/Hiking category
('hiking', 'Guided Tour', 'Professional guide service', 50.00, false, 1),
('hiking', 'Equipment Rental', 'Hiking poles, backpack', 15.00, false, 2),
('hiking', 'Packed Lunch', 'Trail lunch and snacks', 20.00, false, 3),
('hiking', 'Transportation', 'Round-trip to trailhead', 25.00, false, 4),
('hiking', 'Park Entry Fee', 'National/state park entry', 10.00, true, 5),

-- Outdoor general category
('outdoor', 'Equipment Rental', 'Activity-specific equipment', NULL, false, 1),
('outdoor', 'Meals', 'Food and beverages', NULL, false, 2),
('outdoor', 'Transportation', 'Group transportation', NULL, false, 3),
('outdoor', 'Permits & Fees', 'Required permits or entry fees', NULL, false, 4),

-- Skating category
('skating', 'Rink Admission', 'Ice rink entry fee', 15.00, true, 1),
('skating', 'Skate Rental', 'Ice skates rental', 10.00, false, 2),
('skating', 'Lesson', 'Group skating lesson', 40.00, false, 3),
('skating', 'Locker Rental', 'Secure storage', 5.00, false, 4),

-- Games category
('games', 'Venue Fee', 'Game venue entry or rental', NULL, true, 1),
('games', 'Equipment', 'Game equipment or supplies', NULL, false, 2),
('games', 'Refreshments', 'Snacks and drinks', NULL, false, 3),

-- Other/Generic category
('other', 'Activity Fee', 'Main activity cost', NULL, true, 1),
('other', 'Equipment', 'Necessary equipment', NULL, false, 2),
('other', 'Meals', 'Food and beverages', NULL, false, 3),
('other', 'Transportation', 'Travel to/from venue', NULL, false, 4),
('other', 'Insurance', 'Activity insurance', NULL, false, 5);

-- Create a function to get default templates for a category
CREATE OR REPLACE FUNCTION get_component_templates_for_category(event_category text)
RETURNS TABLE (
    name text,
    description text,
    default_price numeric,
    is_required boolean,
    display_order integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.name,
        ct.description,
        ct.default_price,
        ct.is_required,
        ct.display_order
    FROM public.component_templates ct
    WHERE ct.category = event_category
    ORDER BY ct.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.event_components IS 'Sub-items for events (e.g., lift tickets, rentals, meals)';
COMMENT ON TABLE public.component_templates IS 'Default component templates by event category';
COMMENT ON FUNCTION get_component_templates_for_category IS 'Returns default component templates for a given event category';
