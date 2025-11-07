"use server";

import { actionClientWithMeta } from "@/actions/safe-action";
import { createClient } from "@v1/supabase/server";
import { signInSchema } from "./schema";

export const signInAction = actionClientWithMeta
  .schema(signInSchema)
  .metadata({
    name: "signin",
    track: {
      event: "User Signed In",
      channel: "auth",
    },
  })
  .action(async ({ parsedInput }) => {
    const supabase = createClient();

    const result = await supabase.auth.signInWithPassword({
      email: parsedInput.email,
      password: parsedInput.password,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      success: true,
      user: result.data.user,
      message: "Signed in successfully!",
    };
  });
