import { z } from "zod";

export const createOrganisationSchema = z.object({
  body: z.object({
    name: z
      .string({
        error: (issue) => ({
          message:
            issue.input === undefined
              ? "Organisation name is required"
              : "Organisation name must be a string",
        }),
      })
      .min(2, "Name must be at least 2 characters")
      .max(255, "Name must not exceed 255 characters")
      .trim(),
    faculty_id: z
      .number({
        error: (issue) => ({
          message:
            issue.input === undefined
              ? "Faculty ID is required"
              : "Faculty ID must be a number",
        }),
      })
      .int("Faculty ID must be an integer")
      .positive("Faculty ID must be a positive integer")
      .optional()
      .nullable(),
    department_id: z
      .number({
        error: (issue) => ({
          message:
            issue.input === undefined
              ? "Department ID is required"
              : "Department ID must be a number",
        }),
      })
      .int("Department ID must be an integer")
      .positive("Department ID must be a positive integer")
      .optional()
      .nullable(),
  }),
});

export const updateOrganisationSchema = z.object({
  params: z.object({
    id: z
      .string({
        error: (issue) => ({
          message:
            issue.input === undefined
              ? "ID is required"
              : "ID must be a string",
        }),
      })
      .regex(/^\d+$/, "ID must be a numeric value")
      .transform(Number),
  }),
  body: z.object({
    name: z
      .string({
        error: (issue) => ({
          message:
            issue.input === undefined
              ? "Organisation name is required"
              : "Organisation name must be a string",
        }),
      })
      .min(2, "Name must be at least 2 characters")
      .max(255, "Name must not exceed 255 characters")
      .trim()
      .optional(),
    faculty_id: z
      .number({
        error: (issue) => ({
          message:
            issue.input === undefined
              ? "Faculty ID is required"
              : "Faculty ID must be a number",
        }),
      })
      .int("Faculty ID must be an integer")
      .positive("Faculty ID must be a positive integer")
      .optional()
      .nullable(),
    department_id: z
      .number({
        error: (issue) => ({
          message:
            issue.input === undefined
              ? "Department ID is required"
              : "Department ID must be a number",
        }),
      })
      .int("Department ID must be an integer")
      .positive("Department ID must be a positive integer")
      .optional()
      .nullable(),
  }),
});

export const organisationIdParamSchema = z.object({
  params: z.object({
    id: z
      .string({
        error: (issue) => ({
          message:
            issue.input === undefined
              ? "ID is required"
              : "ID must be a string",
        }),
      })
      .regex(/^\d+$/, "ID must be a numeric value")
      .transform(Number),
  }),
});

export const organisationQuerySchema = z.object({
  query: z.object({
    page: z
      .string({
        error: (issue) => ({
          message:
            issue.input === undefined
              ? "Page is required"
              : "Page must be a string",
        }),
      })
      .regex(/^\d+$/, "Page must be a numeric value")
      .transform(Number)
      .default(1),
    limit: z
      .string({
        error: (issue) => ({
          message:
            issue.input === undefined
              ? "Limit is required"
              : "Limit must be a string",
        }),
      })
      .regex(/^\d+$/, "Limit must be a numeric value")
      .transform(Number)
      .default(10),
    name: z
      .string({
        error: (issue) => ({
          message:
            issue.input === undefined
              ? "Name is required"
              : "Name must be a string",
        }),
      })
      .trim()
      .optional(),
    faculty_id: z
      .string({
        error: (issue) => ({
          message:
            issue.input === undefined
              ? "Faculty ID is required"
              : "Faculty ID must be a string",
        }),
      })
      .regex(/^\d+$/, "Faculty ID must be a numeric value")
      .transform(Number)
      .optional(),
    department_id: z
      .string({
        error: (issue) => ({
          message:
            issue.input === undefined
              ? "Department ID is required"
              : "Department ID must be a string",
        }),
      })
      .regex(/^\d+$/, "Department ID must be a numeric value")
      .transform(Number)
      .optional(),
  }),
});

// Inferred types
export type CreateOrganisationInput = z.infer<
  typeof createOrganisationSchema
>["body"];
export type UpdateOrganisationInput = z.infer<
  typeof updateOrganisationSchema
>["body"];
export type OrganisationQueryInput = z.infer<
  typeof organisationQuerySchema
>["query"];