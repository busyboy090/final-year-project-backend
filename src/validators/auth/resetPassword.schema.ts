import { z } from "zod";

export const verifyResetPasswordOTPSchema = z.object({
    body: z.object({
        email: z
            .string({
                error: (issue) => issue.input === undefined
                    ? "Email is required"
                    : "Email must be a string"
            })
            .trim()
            .toLowerCase()
            .email("Please provide a valid email address"),
        otp: z.string({
            error: (issue) => issue.input === undefined
                ? "A 6-digit code is required"
                : "The code must be a string"
        }).length(6, "The code must be exactly 6 digits")
            .regex(/^\d+$/, "The code must only contain numbers")
    })
});


export const resetPasswordSchema = z.object({
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
            .regex(/\d/, "Password must include at least one number"),
        confirm_password: z.string()
    })
}).refine((data) => data.body.password === data.body.confirm_password, {
    path: ["body", "confirm_password"],
    message: "Passwords do not match",
});


export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyResetPasswordInput = z.infer<typeof verifyResetPasswordOTPSchema>;