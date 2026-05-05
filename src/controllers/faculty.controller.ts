import type { Request, Response } from "express";
import { FacultyService } from "../services/faculty.service.ts";

export class FacultyController {
  /**
   * GET /api/v1/faculties
   * Fetches all university faculties with their departments for 
   * student profile selection or event categorization.
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
   * Retrieves a single faculty and its nested department list.
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
   * Administrative endpoint to create new academic faculties at ADUN.
   */
  static async createFaculty(req: Request, res: Response) {
    try {
      const { name, code } = req.body;

      // Basic payload validation
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

      // Handle the existence check from the service
      if (result.reason === "FACULTY_ALREADY_EXISTS") {
        return res.status(409).json({
          success: false,
          message: "A faculty with this name or code already exists in the system.",
          reason: result.reason
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
}