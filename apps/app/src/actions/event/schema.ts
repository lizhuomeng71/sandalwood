import { z } from "zod";

export const eventComponentSchema = z.object({
  name: z.string().min(1, "Component name is required"),
  description: z.string().optional(),
  price: z.number().nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  is_required: z.boolean().optional(),
  display_order: z.number().int().optional(),
});

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime().optional(),
  location: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  category: z.string().optional(),
  components: z.array(eventComponentSchema).optional(),
});

export const updateEventSchema = z.object({
  eventId: z.string().uuid(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  location: z.string().optional(),
  capacity: z.number().int().positive().optional(),
});

export const deleteEventSchema = z.object({
  eventId: z.string().uuid(),
});

export const getEventSchema = z.object({
  eventId: z.string().uuid(),
});
