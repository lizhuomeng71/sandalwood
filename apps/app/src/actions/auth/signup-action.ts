"use server";

import { actionClientWithMeta } from "@/actions/safe-action";
import { createClient } from "@v1/supabase/server";
import { signUpSchema } from "./schema";

export const signUpAction = actionClientWithMeta
  .schema(signUpSchema)
  .metadata({
    name: "signup",
    track: {
      event: "User Signed Up",
      channel: "auth",
    },
  })
  .action(async ({ parsedInput }) => {
    const supabase = createClient();

    // Create user in Supabase Auth
    // The trigger will automatically create the user in public.users
    const result = await supabase.auth.signUp({
      email: parsedInput.email,
      password: parsedInput.password,
      options: {
        data: {
          full_name: parsedInput.full_name,
        },
      },
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      success: true,
      user: result.data.user,
      message: "Account created successfully! Please check your email to verify your account.",
    };
  });
