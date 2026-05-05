import { z } from 'zod';

const venueBody = z.object({
  name: z.string({
    error: (issue) => ({
      message: issue.input === undefined ? "Venue name is required" : "Venue name must be a string"
    })
  }).min(3, "Venue name must be at least 3 characters long").trim(),

  type: z.enum(['hall', 'outdoor', 'classroom', 'auditorium', 'lab'], {
    error: (issue) => ({
      message: issue.input === undefined ? "Venue type is required" : "Type must be: hall, outdoor, classroom, auditorium, or lab"
    })
  }),

  capacity: z.coerce.number({
    error: (issue) => ({
      message: issue.input === undefined ? "Capacity is required" : "Capacity must be a number"
    })
  }).int("Capacity must be a whole number").nonnegative("Capacity cannot be negative"),

  status: z.enum(['available', 'maintenance', 'occupied'], {
    error: (issue) => ({
      message: issue.input === undefined ? "Status is required" : "Status must be: available, maintenance, or occupied"
    })
  }).default('available'),

  location: z.string({
    error: (issue) => ({
      message: issue.input === undefined ? "Location description is required" : "Location must be a string"
    })
  }).min(5, "Please provide a more detailed location description").trim(),

  // Ensures features like "Projector" or "AC" are logged as an array
  features: z.array(z.string().min(1, "Feature cannot be empty"))
    .nonempty("At least one venue feature is required"),

  // Flexible for Multer buffers or Cloudinary URLs
  thumbnail: z.any().optional(),
  images: z.any().array().default([]),
});

export const createVenueSchema = z.object({ body: venueBody });

export const updateVenueSchema = z.object({
  body: venueBody.partial(),
  params: z.object({ 
    id: z.string({
      error: () => ({ message: "Venue ID is required" })
    }) 
  })
});

export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;