import { z } from "zod";

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
    role_codes: z
      .array(z.string().trim())
      .min(1, "At least one role must be assigned")
      .refine(
        (codes) => {
          const validRoles = [
            "student",
            "staff",
            "event-organiser",
            "super-admin",
            "faculty-admin",
            "department-admin",
            "src-exec",
          ];
          return codes.every((code) => validRoles.includes(code));
        },
        {
          message:
            "Invalid role codes. Valid roles are: student, staff, event-organiser, super-admin, faculty-admin, department-admin, src-exec",
        },
      ),
    department_id: z.number().int().positive().optional(),
  }),
});

export const setPasswordSchema = z.object({
  body: z.object({
    userId: z.number().int().positive("User ID must be a positive integer"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters"),
    token: z.string().trim().min(1, "Token is required"),
  }),
});
