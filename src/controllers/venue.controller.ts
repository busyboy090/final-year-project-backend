import type { Request, Response } from "express";
import { VenueService } from "../services/venue.service.ts";
import { CloudinaryHelper } from "../helpers/cloudinary.helper.ts";

export class VenueController {
  /**
   * POST /api/v1/venues
   * Strategy: Validation -> Cloudinary Upload -> Database Save
   */
  static async createVenue(req: Request, res: Response) {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const thumbnailFile = files?.thumbnail?.[0];
      const galleryFiles = files?.images || [];

      // 2. Upload to Cloudinary (Buffers from memory storage)
      let thumbnailURL = "";
      if (thumbnailFile) {
        thumbnailURL = await CloudinaryHelper.uploadSingle(thumbnailFile);
      }

      let galleryURLs: string[] = [];
      if (galleryFiles.length > 0) {
        galleryURLs = await CloudinaryHelper.uploadMultiple(galleryFiles);
      }

      // 3. Prepare payload and save to PostgreSQL
      const finalPayload = {
        ...req.body,
        thumbnail: thumbnailURL,
        images: galleryURLs
      };

      const result = await VenueService.createVenue(finalPayload);

      if (result.ok) {
        return res.status(201).json({
          success: true,
          message: "Venue created successfully.",
          data: result.data
        });
      }

      // Handle logic errors (e.g., Duplicate names)
      return res.status(result.reason === "ALREADY_EXISTS" ? 409 : 400).json({
        success: false,
        message: "A venue with this name already exists.",
        code: "ALREADY_EXISTS"
      });

    } catch (error: any) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  /**
   * PUT /api/v1/venues/:id
   */
  static async updateVenue(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

      // 1. Start with the existing body data
      const updatePayload: any = { ...req.body };

      // 2. Handle Thumbnail Update (if provided)
      const thumbnailFile = files?.thumbnail?.[0];
      if (thumbnailFile) {
        updatePayload.thumbnail = await CloudinaryHelper.uploadSingle(thumbnailFile);
      }

      // 3. Handle Gallery/Images Update (if provided)
      const galleryFiles = files?.images || [];
      if (galleryFiles.length > 0) {
        updatePayload.images = await CloudinaryHelper.uploadMultiple(galleryFiles);
      }

      // 4. Send the merged payload to the service
      const result = await VenueService.updateVenue(Number(id), updatePayload);

      if (result.ok) {
        return res.status(200).json({
          success: true,
          message: "Venue updated successfully.",
          data: result.data
        });
      }

      return res.status(404).json({
        success: false,
        message: result.reason === "VENUE_NOT_FOUND" ? "Venue not found." : "Update failed."
      });

    } catch (error: any) {
      console.error("Update Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error."
      });
    }
  }

  /**
   * GET /api/v1/venues
   */
  static async getAllVenues(req: Request, res: Response) {
    try {
      const minCapacity = req.query.minCapacity ? Number(req.query.minCapacity) : undefined;
      const result = await VenueService.getAllVenues(minCapacity);
      return res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error." });
    }
  }

  /**
   * GET /api/v1/venues/:id
   */
  static async getVenue(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await VenueService.getVenueById(Number(id));

      if (!result.ok) {
        return res.status(404).json({ success: false, message: "Venue not found." });
      }

      return res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error." });
    }
  }
}