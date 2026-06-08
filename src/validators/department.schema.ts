// validators/department.validator.ts
import { z } from 'zod';

const DEPARTMENT_TYPES = [
  "Academic",
  "Administrative",
  "Student Union",
  "Support Unit",
  "Research Unit",
] as const;

const departmentBody = z.object({
  name: z.string({
    error: (issue) => ({
      message: issue.input === undefined
        ? "Department name is required"
        : "Department name must be a string",
    }),
  }).min(3, "Department name must be at least 3 characters long").trim(),

  type: z.enum(DEPARTMENT_TYPES, {
    error: (issue) => ({
      message: issue.input === undefined
        ? "Department type is required"
        : `Type must be one of: ${DEPARTMENT_TYPES.join(", ")}`,
    }),
  }),

  code: z.string({
    error: (issue) => ({
      message: issue.input === undefined
        ? "Department code is required"
        : "Department code must be a string",
    }),
  }).min(2, "Department code must be at least 2 characters long").trim().toUpperCase(),

  facultyId: z.coerce.number({
    error: () => ({ message: "Faculty ID must be a number" }),
  }).int("Faculty ID must be an integer")
    .positive("Faculty ID must be a positive number")
    .optional(),
});

const departmentParams = z.object({
  id: z.string({
    error: () => ({ message: "Department ID is required" }),
  }),
});

const departmentQuery = z.object({
  page:      z.coerce.number().int().positive().optional(),
  limit:     z.coerce.number().int().positive().max(100, "Limit cannot exceed 100").optional(),
  facultyId: z.coerce.number().int().positive().optional(),
  type:      z.enum(DEPARTMENT_TYPES).optional(),
  search:    z.string().trim().optional(),
});

export const createDepartmentSchema = z.object({
  body: departmentBody,
});

export const updateDepartmentSchema = z.object({
  body: departmentBody.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: "Provide at least one field to update." }
  ),
  params: departmentParams,
});

export const getDepartmentByIdSchema = z.object({
  params: departmentParams,
});

export const deleteDepartmentSchema = z.object({
  params: departmentParams,
});

export const getAllDepartmentsSchema = z.object({
  query: departmentQuery,
});

export type CreateDepartmentInput  = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput  = z.infer<typeof updateDepartmentSchema>;
export type GetAllDepartmentsInput = z.infer<typeof getAllDepartmentsSchema>;