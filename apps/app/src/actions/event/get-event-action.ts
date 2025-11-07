"use server";

import { authActionClient } from "@/actions/safe-action";
import { getEvent } from "@v1/supabase/queries";
import { getEventSchema } from "./schema";

export const getEventAction = authActionClient
  .schema(getEventSchema)
  .metadata({
    name: "get-event",
  })
  .action(async ({ parsedInput: { eventId } }) => {
    const result = await getEvent(eventId);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data;
  });
