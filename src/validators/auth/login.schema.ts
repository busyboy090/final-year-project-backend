import { z } from "zod";

export const loginUserSchema = z.object({
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
    password: z.string({
      error: (issue) => issue.input === undefined
        ? "Password is required"
        : "Password must be a string"
    }).min(1, "Password is required"),
  })
});

export type LoginUserInput = z.infer<typeof loginUserSchema>;