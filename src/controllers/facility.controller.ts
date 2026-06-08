import type { Request, Response } from "express";
import { FacilityService } from "../services/facility.service.ts";

export class FacilityController {
  /**
   * GET /api/v1/facilities
   */
  static async getAllFacilities(req: Request, res: Response) {
    try {
      const {
        search,
        page  = "1",
        limit = "20",
      } = req.query as Record<string, string | undefined>;

      const parsedPage  = Math.max(1, parseInt(page  ?? "1",  10));
      const parsedLimit = Math.max(1, parseInt(limit ?? "20", 10));

      const filters = {
        search: search?.trim() || undefined,
        page:   parsedPage,
        limit:  parsedLimit,
      };

      const { facilities, total } = await FacilityService.getAllFacilities(filters);
      
      return res.status(200).json({
        success: true,
        count:   facilities.length,
        total,
        page:    parsedPage,
        limit:   parsedLimit,
        facilities,
      });
    } catch (error) {
      console.error("GET_ALL_FACILITIES_CONTROLLER_CRASH:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }

  /**
   * GET /api/v1/facilities/:id
   */
  static async getFacilityById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsedId = Number(id);

      if (isNaN(parsedId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Facility ID.",
        });
      }

      const result = await FacilityService.getFacilityById(parsedId);

      if (result.ok) {
        return res.status(200).json({
          success: true,
          data: result.data,
        });
      }

      switch (result.reason) {
        case "FACILITY_NOT_FOUND":
          return res.status(404).json({
            success: false,
            message: "The requested facility does not exist.",
            reason: result.reason,
          });
        default:
          return res.status(400).json({
            success: false,
            message: "Failed to retrieve facility.",
          });
      }
    } catch (error) {
      console.error("GET_FACILITY_BY_ID_CONTROLLER_CRASH:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }

  /**
   * POST /api/v1/facilities
   */
  static async createFacility(req: Request, res: Response) {
    try {
      const result = await FacilityService.createFacility(req.body);

      if (result.ok) {
        return res.status(201).json({
          success: true,
          message: "Facility created successfully.",
          data: result.data,
        });
      }

      switch (result.reason) {
        case "ALREADY_EXISTS":
          return res.status(409).json({
            success: false,
            message: "A facility with this name already exists in the registry.",
            reason: result.reason,
          });
        default:
          return res.status(400).json({
            success: false,
            message: "Failed to create facility.",
          });
      }
    } catch (error) {
      console.error("CREATE_FACILITY_CONTROLLER_CRASH:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }

  /**
   * PATCH /api/v1/facilities/:id
   */
  static async updateFacility(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsedId = Number(id);

      if (isNaN(parsedId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Facility ID.",
        });
      }

      const result = await FacilityService.updateFacility(parsedId, req.body);

      if (result.ok) {
        return res.status(200).json({
          success: true,
          message: "Facility updated successfully.",
          data: result.data,
        });
      }

      switch (result.reason) {
        case "FACILITY_NOT_FOUND":
          return res.status(404).json({
            success: false,
            message: "The facility you are trying to update does not exist.",
            reason: result.reason,
          });
        case "FACILITY_NAME_TAKEN":
          return res.status(409).json({
            success: false,
            message: "A facility with this name already exists.",
            reason: result.reason,
          });
        default:
          return res.status(400).json({
            success: false,
            message: "Failed to update facility.",
          });
      }
    } catch (error) {
      console.error("UPDATE_FACILITY_CONTROLLER_CRASH:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }

  /**
   * DELETE /api/v1/facilities/:id
   */
  static async deleteFacility(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsedId = Number(id);

      if (isNaN(parsedId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Facility ID.",
        });
      }

      const result = await FacilityService.deleteFacility(parsedId);

      if (result.ok) {
        return res.status(200).json({
          success: true,
          message: "Facility deleted successfully.",
        });
      }

      switch (result.reason) {
        case "FACILITY_NOT_FOUND":
          return res.status(404).json({
            success: false,
            message: "The facility you are trying to delete does not exist.",
            reason: result.reason,
          });
        default:
          return res.status(400).json({
            success: false,
            message: "Failed to delete facility.",
          });
      }
    } catch (error) {
      console.error("DELETE_FACILITY_CONTROLLER_CRASH:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }
}