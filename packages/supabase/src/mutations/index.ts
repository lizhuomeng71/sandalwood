import { logger } from "@v1/logger";
import { createClient } from "@v1/supabase/server";
import type { Database, Tables, TablesInsert, TablesUpdate } from "../types";

export async function updateUser(userId: string, data: TablesUpdate<"users">) {
  const supabase = createClient();

  try {
    const result = await supabase.from("users").update(data).eq("id", userId);

    return result;
  } catch (error) {
    logger.error(error);

    throw error;
  }
}

export async function createEvent(data: TablesInsert<"events">) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("events")
      .insert(data)
      .select()
      .single();

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function updateEvent(eventId: string, data: TablesUpdate<"events">) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("events")
      .update(data)
      .eq("id", eventId)
      .select()
      .single();

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function deleteEvent(eventId: string) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function createEventComponent(data: TablesInsert<"event_components">) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("event_components")
      .insert(data)
      .select()
      .single();

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function createEventComponents(components: TablesInsert<"event_components">[]) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("event_components")
      .insert(components)
      .select();

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function updateEventComponent(componentId: string, data: TablesUpdate<"event_components">) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("event_components")
      .update(data)
      .eq("id", componentId)
      .select()
      .single();

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function deleteEventComponent(componentId: string) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("event_components")
      .delete()
      .eq("id", componentId);

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function createRegistration(data: TablesInsert<"event_registrations">) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("event_registrations")
      .insert(data)
      .select()
      .single();

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function createRegistrationComponents(components: TablesInsert<"registration_components">[]) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("registration_components")
      .insert(components)
      .select();

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function updateRegistration(registrationId: string, data: TablesUpdate<"event_registrations">) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("event_registrations")
      .update(data)
      .eq("id", registrationId)
      .select()
      .single();

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function cancelRegistration(registrationId: string) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("event_registrations")
      .update({ status: "cancelled" })
      .eq("id", registrationId)
      .select()
      .single();

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}
