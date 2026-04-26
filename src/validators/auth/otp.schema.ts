import { z } from "zod";

export const otpSchema = z.object({
  body: z.object({
    otp: z.string({
      error: (issue) => issue.input === undefined
        ? "A 6-digit code is required"
        : "The code must be a string"
    }).length(6, "The code must be exactly 6 digits")
    .regex(/^\d+$/, "The code must only contain numbers"),
  })
});

export type OTPInput = z.infer<typeof otpSchema>;