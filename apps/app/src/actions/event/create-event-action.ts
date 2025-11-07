"use server";

import { authActionClient } from "@/actions/safe-action";
import { getUser } from "@v1/supabase/queries";
import { createEventSchema } from "./schema";

// Get API URL from environment, fallback to localhost
const getApiUrl = () => {
  const apiUrl = process.env.API_URL || "http://localhost:3001";
  console.log("API_URL:", apiUrl);
  return apiUrl;
};

export const createEventAction = authActionClient
  .schema(createEventSchema)
  .metadata({
    name: "create-event",
  })
  .action(async ({ parsedInput }) => {
    try {
      console.log("[CREATE EVENT] Action started");

      const { data: userData } = await getUser();

      if (!userData.user) {
        throw new Error("User not authenticated");
      }

      const API_BASE_URL = getApiUrl();
      const eventUrl = `${API_BASE_URL}/api/events`;

      console.log("[CREATE EVENT] Creating event at URL:", eventUrl);
      console.log("[CREATE EVENT] Request body:", JSON.stringify({
        user_id: userData.user.id,
        title: parsedInput.title,
        description: parsedInput.description,
        start_date: parsedInput.start_date,
        end_date: parsedInput.end_date,
        location: parsedInput.location,
        capacity: parsedInput.capacity,
        category: parsedInput.category,
      }));

      // Create the event via API
      const eventResponse = await fetch(eventUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userData.user.id,
        title: parsedInput.title,
        description: parsedInput.description,
        start_date: parsedInput.start_date,
        end_date: parsedInput.end_date,
        location: parsedInput.location,
        capacity: parsedInput.capacity,
        category: parsedInput.category,
      }),
    });

    console.log("[CREATE EVENT] Response status:", eventResponse.status);

    if (!eventResponse.ok) {
      const errorText = await eventResponse.text();
      console.error("[CREATE EVENT] Error response:", errorText);
      throw new Error(`Failed to create event: ${errorText}`);
    }

    const responseData = await eventResponse.json();
    console.log("[CREATE EVENT] Response data:", responseData);

    const { data: event } = responseData;

    // Create components if provided
    if (parsedInput.components && parsedInput.components.length > 0 && event) {
      for (const [index, comp] of parsedInput.components.entries()) {
        const componentResponse = await fetch(`${API_BASE_URL}/api/events/${event.id}/components`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: comp.name,
            description: comp.description,
            price: comp.price,
            capacity: comp.capacity,
            is_required: comp.is_required || false,
            order: comp.display_order ?? index,
          }),
        });

        if (!componentResponse.ok) {
          const error = await componentResponse.json();
          throw new Error(`Event created but component failed: ${error.error}`);
        }
      }

      // Fetch complete event with components
      const eventWithComponentsResponse = await fetch(`${API_BASE_URL}/api/events/${event.id}/components`);
      if (eventWithComponentsResponse.ok) {
        const { data: components } = await eventWithComponentsResponse.json();
        return {
          ...event,
          components,
        };
      }
    }

    console.log("[CREATE EVENT] Success, returning event:", event);
      return event;
    } catch (error) {
      console.error("[CREATE EVENT] Error:", error);
      throw error;
    }
  });
