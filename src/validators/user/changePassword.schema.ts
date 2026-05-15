import { z } from "zod";

export const changePasswordSchema = z.object({
  body: z.object({
    current_password: z.string({
      error: (issue) =>
          issue.input === undefined
            ? "Confirm Password is required"
            : "Confirm Password must be a string",
    }),
    new_password: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "New Password is required"
            : "New Password must be a string",
      })
      .min(8, "New Password must be at least 8 characters")
      .max(128, "New Password is too long")
      .regex(/[A-Z]/, "New Password must include at least one uppercase letter")
      .regex(/[a-z]/, "New Password must include at least one lowercase letter")
      .regex(/\d/, "New Password must include at least one number"),
  }),
});

// Type extraction
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>["body"];
