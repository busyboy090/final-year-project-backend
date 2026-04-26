import { z } from "zod";

export const passwordSchema = z.object({
    body: z.object({
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
            .regex(/\d/, "Password must include at least one number")
    })
});

export type PasswordInput = z.infer<typeof passwordSchema>;