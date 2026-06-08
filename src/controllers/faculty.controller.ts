import type { Request, Response } from "express";
import { FacultyService } from "../services/faculty.service.ts";

export class FacultyController {
  /**
   * GET /api/v1/faculties
   */
  static async getAllFaculties(_req: Request, res: Response) {
    try {
      const faculties = await FacultyService.getAllFaculties();

      return res.status(200).json({
        success: true,
        count: faculties.length,
        data: faculties,
      });
    } catch (error) {
      console.error("GET_ALL_FACULTIES_CONTROLLER_CRASH:", error);
      return res.status(500).json({
        success: false,
        message: "An internal server error occurred while fetching faculties.",
      });
    }
  }

  /**
   * GET /api/v1/faculties/:id
   */
  static async getFacultyById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const faculty = await FacultyService.getFacultyById(Number(id));

      if (!faculty) {
        return res.status(404).json({
          success: false,
          message: "The requested faculty does not exist.",
        });
      }

      return res.status(200).json({
        success: true,
        data: faculty,
      });
    } catch (error) {
      console.error("GET_FACULTY_BY_ID_CONTROLLER_CRASH:", error);
      return res.status(500).json({
        success: false,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * POST /api/v1/faculties
   */
  static async createFaculty(req: Request, res: Response) {
    try {
      const { name, code } = req.body;

      if (!name || !code) {
        return res.status(400).json({
          success: false,
          message: "Faculty name and code are required.",
        });
      }

      const result = await FacultyService.createFaculty({ name, code });

      if (result.ok) {
        return res.status(201).json({
          success: true,
          message: "Faculty created successfully.",
          data: result.data,
        });
      }

      if (result.reason === "FACULTY_ALREADY_EXISTS") {
        return res.status(409).json({
          success: false,
          message: "A faculty with this name or code already exists.",
          reason: result.reason,
        });
      }

      return res.status(400).json({
        success: false,
        message: "Failed to create faculty.",
      });
    } catch (error) {
      console.error("CREATE_FACULTY_CONTROLLER_CRASH:", error);
      return res.status(500).json({
        success: false,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * PATCH /api/v1/faculties/:id
   */
  static async updateFaculty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, code } = req.body;

      // At least one field must be present to constitute a valid update
      if (!name && !code) {
        return res.status(400).json({
          success: false,
          message: "Provide at least one field to update: name or code.",
        });
      }

      const result = await FacultyService.updateFaculty(Number(id), { name, code });

      if (result.ok) {
        return res.status(200).json({
          success: true,
          message: "Faculty updated successfully.",
          data: result.data,
        });
      }

      if (result.reason === "FACULTY_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "The faculty you are trying to update does not exist.",
          reason: result.reason,
        });
      }

      if (result.reason === "FACULTY_CODE_TAKEN") {
        return res.status(409).json({
          success: false,
          message: "A faculty with this code already exists.",
          reason: result.reason,
        });
      }

      if (result.reason === "FACULTY_NAME_TAKEN") {
        return res.status(409).json({
          success: false,
          message: "A faculty with this name already exists.",
          reason: result.reason,
        });
      }

      return res.status(400).json({
        success: false,
        message: "Failed to update faculty.",
      });
    } catch (error) {
      console.error("UPDATE_FACULTY_CONTROLLER_CRASH:", error);
      return res.status(500).json({
        success: false,
        message: "An internal server error occurred.",
      });
    }
  }

  /**
   * DELETE /api/v1/faculties/:id
   */
  static async deleteFaculty(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await FacultyService.deleteFaculty(Number(id));

      if (result.ok) {
        return res.status(200).json({
          success: true,
          message: "Faculty deleted successfully.",
        });
      }

      if (result.reason === "FACULTY_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "The faculty you are trying to delete does not exist.",
          reason: result.reason,
        });
      }

      return res.status(400).json({
        success: false,
        message: "Failed to delete faculty.",
      });
    } catch (error) {
      console.error("DELETE_FACULTY_CONTROLLER_CRASH:", error);
      return res.status(500).json({
        success: false,
        message: "An internal server error occurred.",
      });
    }
  }
}