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
