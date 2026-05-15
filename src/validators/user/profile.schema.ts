import { z } from "zod";

/**
 * Base User Schema
 * Validates fields that exist on the main User table.
 */
export const baseUserUpdateSchema = z.object({
  body: z.object({
    first_name: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters")
      .max(100, "First name is too long")
      .nullable()
      .optional(),

    last_name: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters")
      .max(100, "Last name is too long")
      .nullable()
      .optional(),
  })
});

/**
 * Student Profile Schema
 * Used for the profile completion step for students.
 */
export const studentProfileSchema = baseUserUpdateSchema.extend({
  body: z.object({
    title: z
      .string()
      .trim()
      .nullable()
      .optional(),

    matric_no: z
      .string({
        error: (issue) => issue.input === undefined
          ? "Matric number is required"
          : "Matric number must be a string"
      })
      .trim()
      .regex(/^[A-Z0-9/]+$/, "Invalid format (use e.g., ADUN/FS/SEN/22/001)"),

    department_id: z
      .number({
        error: (issue) => issue.input === undefined
          ? "Department is required"
          : "Department ID must be a number"
      })
      .int()
      .positive("Please select a valid department"),

    gender: z
      .enum(["male", "female", "other"], {
        error: (issue) => issue.input === undefined
          ? "Gender is required"
          : "Select a valid gender"
      })
      .optional()
      .nullable(),

    level_id: z
      .number({
        error: (issue) => issue.input === undefined
          ? "Level is required"
          : "Level ID must be a number"
      })
      .int()
      .positive("Please select a valid level"),

    phone: z.string().trim().optional().nullable(),
  })
});

/**
 * Staff Profile Schema
 * Used for the profile completion step for staff members.
 */
export const staffProfileSchema = baseUserUpdateSchema.extend({
  body: z.object({
    staff_id: z
      .string({
        error: (issue) => issue.input === undefined
          ? "Staff ID is required"
          : "Staff ID must be a string"
      })
      .trim(),

    title: z
      .string()
      .trim()
      .nullable()
      .optional(),

    faculty_id: z
      .number({
        error: (issue) => issue.input === undefined
          ? "Faculty is required"
          : "Faculty ID must be a number"
      })
      .int()
      .positive("Please select a valid faculty"),

    department_id: z
      .number({
        error: (issue) => issue.input === undefined
          ? "Department is required"
          : "Department ID must be a number"
      })
      .int()
      .positive("Please select a valid department"),
  })
});

/**
 * Avatar Update Schema
 */
export const avatarUpdateSchema = z.object({
  body: z.object({
    url: z
      .string({
        error: (issue) => issue.input === undefined
          ? "URL is required"
          : "URL must be a string"
      })
      .url("Invalid URL format"),
  })
});

// TypeScript Types extracted from the schemas
export type BaseUserUpdateInput = z.infer<typeof baseUserUpdateSchema>;
export type StudentProfileInput = z.infer<typeof studentProfileSchema>;
export type StaffProfileInput = z.infer<typeof staffProfileSchema>;
export type AvatarUpdateInput = z.infer<typeof avatarUpdateSchema>;