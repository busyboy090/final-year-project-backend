import { z } from "zod";

export const emailSchema = z.object({
  body: z.object({
    email: z
      .string({
        error: (issue) => issue.input === undefined
          ? "Email is required"
          : "Email must be a string"
      })
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address")
  })
});


export type EmailInput = z.infer<typeof emailSchema>;