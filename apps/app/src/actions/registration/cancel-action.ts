"use server";

import { authActionClient } from "@/actions/safe-action";
import { cancelRegistration } from "@v1/supabase/mutations";
import { cancelRegistrationSchema } from "./schema";

export const cancelRegistrationAction = authActionClient
  .schema(cancelRegistrationSchema)
  .metadata({
    name: "cancel-registration",
    track: {
      event: "Event Registration Cancelled",
      channel: "events",
    },
  })
  .action(async ({ parsedInput }) => {
    const result = await cancelRegistration(parsedInput.registration_id);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data;
  });
