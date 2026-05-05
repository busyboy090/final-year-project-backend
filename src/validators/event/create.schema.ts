import { z } from 'zod';

/**
 * Validation schema for ADUN-EMS Events.
 * Ensures structural integrity for event creation and updates.
 */
export const eventSchema = z.object({
  body: z.object({
    title: z.string({
      error: (issue) => ({
        message: issue.input === undefined
          ? "Event title is required"
          : "Event title must be a string"
      })
    }).min(5, "Title must be at least 5 characters long").trim(),

    thumbnail: z.string({
      error: (issue) => ({
        message: issue.input === undefined
          ? "Thumbnail is required"
          : "Thumbnail must be a valid URL string"
      })
    }).url("Thumbnail must be a valid URL"),

    organizer: z.string({
      error: (issue) => ({
        message: issue.input === undefined
          ? "Organizer name is required"
          : "Organizer must be a string"
      })
    }).min(2, "Organizer name is too short").trim(),

    department: z.string({
      error: (issue) => ({
        message: issue.input === undefined
          ? "Department is required"
          : "Department must be a string"
      })
    }).nullable(),

    venue: z.number({
      error: (issue) => ({
        message: issue.input === undefined
          ? "Venue ID is required"
          : "Venue ID must be a number"
      })
    }).int().positive(),

    start_date: z.coerce.date({
      error: (issue) => ({
        message: issue.input === undefined
          ? "Start date is required"
          : "Invalid start date format"
      })
    }).refine((date) => date > new Date(), {
      message: "Start date must be in the future"
    }),

    end_date: z.coerce.date({
      error: (issue) => ({
        message: issue.input === undefined
          ? "End date is required"
          : "Invalid end date format"
      })
    }),

    capacity: z.number({
      error: (issue) => ({
        message: issue.input === undefined
          ? "Capacity is required"
          : "Capacity must be a number"
      })
    }).int().nonnegative("Capacity cannot be negative"),

    status: z.enum(['pending', 'approved', 'rejected'], {
      error: (issue) => ({
        message: issue.input === undefined
          ? "Status is required"
          : "Status must be: pending, approved, or rejected"
      })
    }).default('pending'),
  }).refine((data) => data.end_date > data.start_date, {
    message: "End date must be after the start date",
    path: ["end_date"],
  })
});

/**
 * Event Update Schema (Partial)
 */
export const updateEventSchema = z.object({
  body: eventSchema.shape.body.partial(),
  params: z.object({
    id: z.string({
      error: (issue: any) => ({
        message: issue.input === undefined ? "Event ID is required" : "Event ID must be a string"
      })
    })
  })
});

export type EventInput = z.infer<typeof eventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;