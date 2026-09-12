import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters long.").max(128, "Password must be 128 characters or fewer."),
  name: z.string().trim().min(1, "Name is required.").max(100).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters long.").max(128, "Password must be 128 characters or fewer."),
});

export const profileSchema = z.object({
  displayName: z.string().trim().max(100).optional().or(z.literal("")),
  age: z.coerce.number().int().min(10).max(120).optional(),
  gender: z.string().trim().max(50).optional().or(z.literal("")),
  heightCm: z.coerce.number().min(50).max(250).optional(),
  unitSystem: z.enum(["metric", "imperial"]).default("metric"),
});
