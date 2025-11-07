"use server";

import { authActionClient } from "@/actions/safe-action";
import { deleteEvent } from "@v1/supabase/mutations";
import { deleteEventSchema } from "./schema";

export const deleteEventAction = authActionClient
  .schema(deleteEventSchema)
  .metadata({
    name: "delete-event",
  })
  .action(async ({ parsedInput: { eventId } }) => {
    const result = await deleteEvent(eventId);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return { success: true };
  });
