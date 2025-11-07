"use server";

import { actionClientWithMeta } from "@/actions/safe-action";
import { createClient } from "@v1/supabase/server";
import { oauthSignInSchema } from "./schema";
import { redirect } from "next/navigation";

export const oauthSignInAction = actionClientWithMeta
  .schema(oauthSignInSchema)
  .metadata({
    name: "oauth-signin",
    track: {
      event: "User OAuth Sign In Initiated",
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

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: parsedInput.provider,
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.url) {
      redirect(data.url);
    }

    return {
      success: true,
      message: "Redirecting to OAuth provider...",
    };
  });
