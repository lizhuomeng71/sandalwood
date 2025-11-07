import { logger } from "@v1/logger";
import { createClient } from "@v1/supabase/server";

export async function getUser() {
  const supabase = createClient();

  try {
    const result = await supabase.auth.getUser();

    return result;
  } catch (error) {
    logger.error(error);

    throw error;
  }
}

export async function getPosts() {
  const supabase = createClient();

  try {
    const result = await supabase.from("posts").select("*");

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function getEvents() {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("events")
      .select("*")
      .order("start_date", { ascending: true });

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function getEvent(id: string) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function getEventsByUser(userId: string) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("events")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: true });

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function getUserProfile(userId: string) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function getCurrentUserProfile() {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const result = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function getEventComponents(eventId: string) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("event_components")
      .select("*")
      .eq("event_id", eventId)
      .order("display_order", { ascending: true });

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function getComponentTemplates(category: string) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("component_templates")
      .select("*")
      .eq("category", category)
      .order("display_order", { ascending: true });

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function getEventWithComponents(eventId: string) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("events")
      .select(`
        *,
        event_components (*)
      `)
      .eq("id", eventId)
      .single();

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function getEventRegistrations(eventId: string) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("event_registrations")
      .select(`
        *,
        users (
          id,
          email,
          full_name
        ),
        registration_components (
          *,
          event_components (
            name,
            description
          )
        )
      `)
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function getUserRegistrations(userId: string) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("event_registrations")
      .select(`
        *,
        events (
          id,
          title,
          start_date,
          end_date,
          location
        ),
        registration_components (
          *,
          event_components (
            name,
            description
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function getRegistration(registrationId: string) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("event_registrations")
      .select(`
        *,
        events (
          id,
          title,
          start_date,
          end_date,
          location
        ),
        registration_components (
          *,
          event_components (
            name,
            description,
            price
          )
        )
      `)
      .eq("id", registrationId)
      .single();

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function checkUserRegistration(eventId: string, userId: string) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("event_registrations")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}
