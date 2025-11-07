"use server";

import { authActionClient } from "@/actions/safe-action";
import { getEvents } from "@v1/supabase/queries";

export const getEventsAction = authActionClient
  .metadata({
    name: "get-events",
  })
  .action(async () => {
    const result = await getEvents();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data;
  });
