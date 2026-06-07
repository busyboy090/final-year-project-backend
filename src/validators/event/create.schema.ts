import { z } from "zod";

const positiveIntegerString = (field: string, min = 1) =>
  z
    .string({
      error: (issue) => ({
        message:
          issue.input === undefined
            ? `${field} is required`
            : `${field} must be a valid number`,
      }),
    })
    .trim()
    .refine((value) => /^[1-9]\d*$/.test(value), `${field} must be a positive whole number`)
    .refine((value) => Number(value) >= min, `${field} must be at least ${min}`);

const validDateTimeRange = (data: {
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
}) => {
  const start = new Date(`${data.startDate}T${data.startTime}:00`);
  const end = new Date(`${data.endDate}T${data.endTime}:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  return end > start;
};

/**
 * Base Event Body Fields Definition matching React EventFormValues
 */
const eventBodyFields = z.object({
  title: z
    .string({
      error: (issue) => ({
        message:
          issue.input === undefined
            ? "Event title is required"
            : "Event title must be a string",
      }),
    })
    .min(5, "Title must be at least 5 characters long")
    .trim(),

  description: z.string().min(1, "Description is required"),

  // Synchronized field name from selectedVenue to venue_id
  venue_id: positiveIntegerString("Venue selection"),

  capacity: positiveIntegerString("Capacity", 5),

  category: z.enum(
    [
      "Academic Conference",
      "Workshop",
      "Cultural Event",
      "Sports Match",
      "Exhibition/Expo",
      "Social Gathering/Party",
    ],
    {
      error: (issue) => ({
        message:
          issue.input === undefined
            ? "Event category is required"
            : "Category must be: Academic Conference, Workshop, Cultural Event, Sports Match, Exhibition/Expo, Social Gathering/Party",
      }),
    },
  ),

  thumbnail: z.any(),

  startDate: z.string({ error: () => ({ message: "Start date is required" }) }).min(1, "Start date is required"),
  startTime: z.string({ error: () => ({ message: "Start time is required" }) }).min(1, "Start time is required"),
  endDate: z.string({ error: () => ({ message: "End date is required" }) }).min(1, "End date is required"),
  endTime: z.string({ error: () => ({ message: "End time is required" }) }).min(1, "End time is required"),
});

/**
 * Validation schema for Event Creation
 */
export const eventSchema = z.object({
  body: eventBodyFields.refine(
    validDateTimeRange,
    {
      message: "End date and time must be after the start date and time",
      path: ["endDate"],
    },
  ),
});

/**
 * Event Update Schema (Allows partial changes)
 */
export const updateEventSchema = z.object({
  params: z.object({
    id: z.coerce
      .number({
        error: (issue) => ({
          message:
            issue.input === undefined
              ? "Event ID is required"
              : "Event ID must be a valid number",
        }),
      })
      .int()
      .positive(),
  }),
  body: eventBodyFields.partial().refine(
    (data) => {
      // Dynamic fallback compilation for safer partial scheduling evaluations
      const checkStart = data.startDate || data.startTime;
      const checkEnd = data.endDate || data.endTime;

      if (checkStart || checkEnd) {
        // Use provided values or a standard runtime proxy to avoid string concatenation crashes
        const finalStartDate = data.startDate || "1970-01-01";
        const finalStartTime = data.startTime || "00:00";
        const finalEndDate = data.endDate || "1970-01-01";
        const finalEndTime = data.endTime || "00:00";

        const start = new Date(`${finalStartDate}T${finalStartTime}:00`);
        const end = new Date(`${finalEndDate}T${finalEndTime}:00`);

        // Only enforce the chronologically ahead validation if both discrete blocks are modified
        if (data.startDate && data.endDate) {
          return end > start;
        }
      }
      return true;
    },
    {
      message: "End date and time must be after the start date and time",
      path: ["endDate"],
    },
  ),
});

/**
 * Administrative Workflow Verification
 */
export const updateEventStatusSchema = z.object({
  params: z.object({
    id: z.coerce
      .number({
        error: () => ({ message: "Event ID parameter must be a valid number" }),
      })
      .int()
      .positive(),
  }),
  body: z.object({
    status: z.enum(["approved", "rejected"], {
      error: (issue) => ({
        message:
          issue.input === undefined
            ? "Status is required"
            : "Status must be: approved or rejected",
      }),
    }),
  }),
});

// Export inferred types
export type EventInput = z.infer<typeof eventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type UpdateEventStatusInput = z.infer<typeof updateEventStatusSchema>;
