import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(1, "Full name is required"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signOutSchema = z.object({});

export const oauthSignInSchema = z.object({
  provider: z.enum(["google", "apple", "azure"]),
  redirectTo: z.string().optional(),
});

export const magicLinkSchema = z.object({
  email: z.string().email("Invalid email address"),
  redirectTo: z.string().optional(),
});
