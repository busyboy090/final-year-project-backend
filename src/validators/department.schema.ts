import { z } from 'zod';

const departmentBody = z.object({
  name: z.string({
    error: (issue) => ({
      message: issue.input === undefined ? "Department name is required" : "Department name must be a string"
    })
  }).min(3, "Department name must be at least 3 characters long").trim(),

  type: z.enum(["Academic","Administrative","Student Union","Support Unit","Research Unit"], {
    error: (issue) => ({
      message: issue.input === undefined ? "Department type is required" : "Type must be: Academic, Administrative, Student Union, Support Unit, Research Unit"
    })
  }),

  code: z.string({
    error: (issue) => ({
      message: issue.input === undefined ? "Department code is required" : "Department code must be a string"
    })
  }).min(3, "Department code must be at least 3 characters long").trim()
  .toUpperCase(),

  facultyId: z.coerce.number().int().positive().optional() 
});

export const createDepartmentSchema = z.object({ body: departmentBody });

export const updateDepartmentSchema = z.object({
  body: departmentBody.partial(),
  params: z.object({ 
    id: z.string({
      error: () => ({ message: "Department ID is required" })
    }) 
  })
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
