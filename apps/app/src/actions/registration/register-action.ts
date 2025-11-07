"use server";

import { authActionClient } from "@/actions/safe-action";
import { createRegistration, createRegistrationComponents } from "@v1/supabase/mutations";
import { getUser } from "@v1/supabase/queries";
import { registerForEventSchema } from "./schema";

export const registerForEventAction = authActionClient
  .schema(registerForEventSchema)
  .metadata({
    name: "register-for-event",
    track: {
      event: "Event Registration Created",
      channel: "events",
    },
  })
  .action(async ({ parsedInput }) => {
    const { data: userData } = await getUser();

    if (!userData.user) {
      throw new Error("User not authenticated");
    }

    // Calculate total amount
    const totalAmount = parsedInput.selected_components.reduce(
      (sum, comp) => sum + (comp.price || 0) * comp.quantity,
      0
    );

    // Create the registration
    const registrationResult = await createRegistration({
      event_id: parsedInput.event_id,
      user_id: userData.user.id,
      status: "pending",
      total_amount: totalAmount,
      payment_status: "unpaid",
      notes: parsedInput.notes,
    });

    if (registrationResult.error) {
      throw new Error(registrationResult.error.message);
    }

    const registration = registrationResult.data;

    // Create registration components if any selected
    if (parsedInput.selected_components.length > 0 && registration) {
      const componentsData = parsedInput.selected_components.map((comp) => ({
        registration_id: registration.id,
        component_id: comp.component_id,
        quantity: comp.quantity,
        price_at_registration: comp.price || 0,
      }));

      const componentsResult = await createRegistrationComponents(componentsData);

      if (componentsResult.error) {
        throw new Error(`Registration created but components failed: ${componentsResult.error.message}`);
      }

      return {
        ...registration,
        components: componentsResult.data,
      };
    }

    return registration;
  });
