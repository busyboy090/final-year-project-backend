import { z } from "zod";

export const registerUserSchema = z
  .object({
    body: z.object({
      first_name: z
        .string({
          error: (issue) => issue.input === undefined
            ? "First name is required"
            : "First name must be a string"
        })
        .trim()
        .min(2, "First name must be at least 2 characters")
        .max(100, "First name is too long"),
      last_name: z
        .string({
          error: (issue) => issue.input === undefined
            ? "Last name is required"
            : "Last name must a string"
        })
        .trim()
        .min(2, "Last name must be at least 2 characters")
        .max(100, "Last name is too long"),
      email: z
        .string({
          error: (issue) => issue.input === undefined
            ? "Email is required"
            : "Email must be a string"
        })
        .trim()
        .toLowerCase()
        .email("Please provide a valid email address"),
      password: z
        .string({
          error: (issue) => issue.input === undefined
            ? "Password is required"
            : "Password must be a string"
        })
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password is too long")
        .regex(/[A-Z]/, "Password must include at least one uppercase letter")
        .regex(/[a-z]/, "Password must include at least one lowercase letter")
        .regex(/\d/, "Password must include at least one number"),
      confirm_password: z.string()
    })
  })
  .refine((data) => data.body.password === data.body.confirm_password, {
    path: ["body", "confirm_password"],
    message: "Passwords do not match",
  });

export type RegisterUserInput = z.infer<typeof registerUserSchema>["body"];