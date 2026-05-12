import { z } from "zod";

export const toggle2FASchema = z.object({
  body: z.object({
    enabled: z.boolean({
      error: (issue) => issue.input === undefined
        ? "Toggle state is required"
        : "Toggle state must be boolean"
    }),
  }),
});

export type Toggle2FAInput = z.infer<typeof toggle2FASchema>;