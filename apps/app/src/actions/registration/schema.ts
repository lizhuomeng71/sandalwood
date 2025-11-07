import { z } from "zod";

export const selectedComponentSchema = z.object({
  component_id: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
  price: z.number().nullable(),
});

export const registerForEventSchema = z.object({
  event_id: z.string().uuid(),
  selected_components: z.array(selectedComponentSchema),
  notes: z.string().optional(),
});

export const cancelRegistrationSchema = z.object({
  registration_id: z.string().uuid(),
});

export const updateRegistrationStatusSchema = z.object({
  registration_id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "cancelled", "waitlist"]),
});
