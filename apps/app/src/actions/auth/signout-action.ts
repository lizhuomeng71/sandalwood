"use server";

import { actionClientWithMeta } from "@/actions/safe-action";
import { createClient } from "@v1/supabase/server";
import { signOutSchema } from "./schema";

export const signOutAction = actionClientWithMeta
  .schema(signOutSchema)
  .metadata({
    name: "signout",
    track: {
      event: "User Signed Out",
      channel: "auth",
    },
  })
  .action(async () => {
    const supabase = createClient();

    const result = await supabase.auth.signOut();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      success: true,
      message: "Signed out successfully!",
    };
  });
