import { z } from 'zod';

const facilityBody = z.object({
  name: z.string({
    error: (issue) => ({
      message: issue.input === undefined ? "Facility name is required" : "Facility name must be a string"
    })
  }).min(2, "Facility name is too short").trim(),
  description: z.string().optional(),
});

export const createFacilitySchema = z.object({ body: facilityBody });
export const updateFacilitySchema = z.object({
  body: facilityBody.partial(),
  params: z.object({ id: z.string() })
});

export type CreateFacilityInput = z.infer<typeof createFacilitySchema>;
export type UpdateFacilityInput = z.infer<typeof updateFacilitySchema>;