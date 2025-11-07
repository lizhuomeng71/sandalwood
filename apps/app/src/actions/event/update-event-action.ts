"use server";

import { authActionClient } from "@/actions/safe-action";
import { updateEvent } from "@v1/supabase/mutations";
import { updateEventSchema } from "./schema";

export const updateEventAction = authActionClient
  .schema(updateEventSchema)
  .metadata({
    name: "update-event",
  })
  .action(async ({ parsedInput: { eventId, ...data } }) => {
    const result = await updateEvent(eventId, data);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data;
  });
