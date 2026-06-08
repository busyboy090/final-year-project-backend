import { z } from 'zod';

const facultyBody = z.object({
  name: z.string({
    error: (issue) => ({
      message: issue.input === undefined
        ? "Faculty name is required"
        : "Faculty name must be a string"
    })
  }).min(3, "Faculty name must be at least 3 characters long").trim(),

  code: z.string({
    error: (issue) => ({
      message: issue.input === undefined
        ? "Faculty code is required"
        : "Faculty code must be a string"
    })
  }).min(2, "Faculty code must be at least 2 characters long").trim().toUpperCase(),
});

export const createFacultySchema = z.object({ body: facultyBody });

export const updateFacultySchema = z.object({
  body: facultyBody.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: "Provide at least one field to update: name or code" }
  ),
  params: z.object({
    id: z.string({
      error: () => ({ message: "Faculty ID is required" })
    })
  })
});

export const facultyParamsSchema = z.object({
  params: z.object({
    id: z.string({
      error: () => ({ message: "Faculty ID is required" })
    })
  })
});

export type CreateFacultyInput = z.infer<typeof createFacultySchema>;
export type UpdateFacultyInput = z.infer<typeof updateFacultySchema>;