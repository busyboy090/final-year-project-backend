import { z } from 'zod';

const facilityBody = z.object({
  name: z.string({
    error: (issue) => ({
      message: issue.input === undefined
        ? "Facility name is required"
        : "Facility name must be a string"
    })
  }).min(2, "Facility name must be at least 2 characters long").trim(),

  description: z.string({
    error: () => ({
      message: "Description must be a string"
    })
  }).trim().optional()
});

export const createFacilitySchema = z.object({ 
  body: facilityBody 
});

export const updateFacilitySchema = z.object({
  body: facilityBody.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: "Provide at least one field to update: name, description, or icon" }
  ),
  params: z.object({
    id: z.string({
      error: () => ({ message: "Facility ID is required" })
    })
  })
});

export const facilityParamsSchema = z.object({
  params: z.object({
    id: z.string({
      error: () => ({ message: "Facility ID is required" })
    })
  })
});

export type CreateFacilityInput = z.infer<typeof createFacilitySchema>;
export type UpdateFacilityInput = z.infer<typeof updateFacilitySchema>;