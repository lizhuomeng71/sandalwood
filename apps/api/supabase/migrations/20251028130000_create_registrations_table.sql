-- Create event_registrations table
CREATE TABLE public.event_registrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending',
    total_amount numeric(10, 2) NOT NULL DEFAULT 0,
    payment_status text NOT NULL DEFAULT 'unpaid',
    payment_intent_id text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),

    CONSTRAINT event_registrations_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled', 'waitlist')),
    CONSTRAINT event_registrations_payment_status_check CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'partial')),
    CONSTRAINT event_registrations_total_amount_check CHECK (total_amount >= 0),
    CONSTRAINT event_registrations_unique_user_event UNIQUE (event_id, user_id)
);

-- Create index on event_id for faster queries
CREATE INDEX idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX idx_event_registrations_status ON public.event_registrations(status);

-- Enable row level security (RLS)
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Create a trigger to update the updated_at column
CREATE TRIGGER event_registrations_updated_at
BEFORE UPDATE ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- RLS Policies for event_registrations

-- Users can view their own registrations
CREATE POLICY select_own_registrations ON public.event_registrations
FOR SELECT USING (auth.uid() = user_id);

-- Event owners can view all registrations for their events
CREATE POLICY select_event_owner_registrations ON public.event_registrations
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = event_registrations.event_id
        AND events.user_id = auth.uid()
    )
);

-- Users can create registrations for themselves
CREATE POLICY insert_own_registrations ON public.event_registrations
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own registrations (e.g., cancel)
CREATE POLICY update_own_registrations ON public.event_registrations
FOR UPDATE USING (auth.uid() = user_id);

-- Event owners can update registrations for their events (e.g., confirm)
CREATE POLICY update_event_owner_registrations ON public.event_registrations
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = event_registrations.event_id
        AND events.user_id = auth.uid()
    )
);

-- Create registration_components junction table
CREATE TABLE public.registration_components (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id uuid NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
    component_id uuid NOT NULL REFERENCES public.event_components(id) ON DELETE CASCADE,
    quantity integer NOT NULL DEFAULT 1,
    price_at_registration numeric(10, 2) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),

    CONSTRAINT registration_components_quantity_check CHECK (quantity > 0),
    CONSTRAINT registration_components_price_check CHECK (price_at_registration >= 0),
    CONSTRAINT registration_components_unique UNIQUE (registration_id, component_id)
);

-- Create indexes
CREATE INDEX idx_registration_components_registration_id ON public.registration_components(registration_id);
CREATE INDEX idx_registration_components_component_id ON public.registration_components(component_id);

-- Enable RLS
ALTER TABLE public.registration_components ENABLE ROW LEVEL SECURITY;

-- RLS Policies for registration_components

-- Users can view components for their own registrations
CREATE POLICY select_own_registration_components ON public.registration_components
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.event_registrations
        WHERE event_registrations.id = registration_components.registration_id
        AND event_registrations.user_id = auth.uid()
    )
);

-- Event owners can view components for registrations in their events
CREATE POLICY select_event_owner_registration_components ON public.registration_components
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.event_registrations er
        JOIN public.events e ON e.id = er.event_id
        WHERE er.id = registration_components.registration_id
        AND e.user_id = auth.uid()
    )
);

-- Users can create components for their own registrations
CREATE POLICY insert_own_registration_components ON public.registration_components
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.event_registrations
        WHERE event_registrations.id = registration_components.registration_id
        AND event_registrations.user_id = auth.uid()
    )
);

-- Function to update component registration counts
CREATE OR REPLACE FUNCTION update_component_registrations()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment current_registrations
        UPDATE public.event_components
        SET current_registrations = current_registrations + NEW.quantity
        WHERE id = NEW.component_id;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement current_registrations
        UPDATE public.event_components
        SET current_registrations = current_registrations - OLD.quantity
        WHERE id = OLD.component_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Adjust by difference
        UPDATE public.event_components
        SET current_registrations = current_registrations + (NEW.quantity - OLD.quantity)
        WHERE id = NEW.component_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update component registrations
CREATE TRIGGER update_component_registrations_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.registration_components
FOR EACH ROW
EXECUTE FUNCTION update_component_registrations();

-- Function to check component capacity before registration
CREATE OR REPLACE FUNCTION check_component_capacity()
RETURNS TRIGGER AS $$
DECLARE
    component_capacity integer;
    current_count integer;
BEGIN
    -- Get component capacity and current registrations
    SELECT capacity, current_registrations
    INTO component_capacity, current_count
    FROM public.event_components
    WHERE id = NEW.component_id;

    -- If capacity is set (not null), check if we'd exceed it
    IF component_capacity IS NOT NULL THEN
        IF (current_count + NEW.quantity) > component_capacity THEN
            RAISE EXCEPTION 'Component capacity exceeded. Available: %, Requested: %',
                (component_capacity - current_count), NEW.quantity;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check capacity before inserting registration components
CREATE TRIGGER check_component_capacity_trigger
BEFORE INSERT OR UPDATE ON public.registration_components
FOR EACH ROW
EXECUTE FUNCTION check_component_capacity();

-- Create view for registration details with components
CREATE VIEW public.registration_details AS
SELECT
    er.id,
    er.event_id,
    er.user_id,
    er.status,
    er.total_amount,
    er.payment_status,
    er.notes,
    er.created_at,
    er.updated_at,
    e.title as event_title,
    e.start_date as event_start_date,
    e.location as event_location,
    u.email as user_email,
    u.full_name as user_name,
    json_agg(
        json_build_object(
            'component_id', rc.component_id,
            'component_name', ec.name,
            'quantity', rc.quantity,
            'price', rc.price_at_registration
        )
    ) FILTER (WHERE rc.id IS NOT NULL) as components
FROM public.event_registrations er
JOIN public.events e ON e.id = er.event_id
JOIN public.users u ON u.id = er.user_id
LEFT JOIN public.registration_components rc ON rc.registration_id = er.id
LEFT JOIN public.event_components ec ON ec.id = rc.component_id
GROUP BY er.id, e.title, e.start_date, e.location, u.email, u.full_name;

-- Grant permissions on the view
GRANT SELECT ON public.registration_details TO authenticated;

COMMENT ON TABLE public.event_registrations IS 'Stores user registrations for events';
COMMENT ON TABLE public.registration_components IS 'Tracks which components each registration includes';
COMMENT ON VIEW public.registration_details IS 'Convenient view of registrations with all related data';
COMMENT ON FUNCTION update_component_registrations IS 'Automatically updates component registration counts';
COMMENT ON FUNCTION check_component_capacity IS 'Prevents over-capacity registrations';
