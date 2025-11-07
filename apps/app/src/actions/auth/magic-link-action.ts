"use server";

import { actionClientWithMeta } from "@/actions/safe-action";
import { createClient } from "@v1/supabase/server";
import { magicLinkSchema } from "./schema";

export const magicLinkAction = actionClientWithMeta
  .schema(magicLinkSchema)
  .metadata({
    name: "magic-link",
    track: {
      event: "Magic Link Requested",
      channel: "auth",
    },
  })
  .action(async ({ parsedInput }) => {
    const supabase = createClient();

    // Build the callback URL with the redirect parameter
    const callbackUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`);
    if (parsedInput.redirectTo) {
      callbackUrl.searchParams.set("next", parsedInput.redirectTo);
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: parsedInput.email,
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message: "Check your email for the magic link!",
    };
  });
