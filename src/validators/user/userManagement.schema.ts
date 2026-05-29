import { z } from "zod";

export const listUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().trim().optional(),
    role: z.string().trim().optional(),
    department_id: z.coerce.number().int().positive().optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z
    .object({
      first_name: z.string().trim().min(1).max(100).optional(),
      last_name: z.string().trim().min(1).max(100).optional(),
      email: z.string().trim().email().optional(),
      is_active: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
});

export const createUserSchema = z.object({
  body: z.object({
    first_name: z
      .string()
      .trim()
      .min(1, "First name is required")
      .max(100, "First name must not exceed 100 characters"),
    last_name: z
      .string()
      .trim()
      .min(1, "Last name is required")
      .max(100, "Last name must not exceed 100 characters"),
    email: z.string().trim().email("Invalid email format"),
    role: z
      .enum(["event-organiser","staff","student"], {
        error: (issue) => issue.input === undefined
          ? "A role is required"
          : "Select a valid role (event-organiser, staff, or student)"
      }),

    organisation_id: z.number().int().positive().optional(),
  }),
});

export const setPasswordSchema = z.object({
  body: z.object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters"),
  }),
  query: z.object({
    token: z.string().trim().min(1, "Token is required"),
  }),
});
