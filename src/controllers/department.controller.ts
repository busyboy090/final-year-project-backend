import type { Request, Response } from "express";
import { DepartmentService } from "../services/department.service.ts";

export class DepartmentController {
  /**
   * GET /api/v1/departments
   */
  static async getAllDepartments(req: Request, res: Response) {
    try {
      const {
        facultyId,
        search,
        page  = "1",
        limit = "20",
        type,
      } = req.query as Record<string, string | undefined>;

      const parsedPage  = Math.max(1, parseInt(page  ?? "1",  10));
      const parsedLimit = Math.max(1, parseInt(limit ?? "20", 10));

      const filters = {
        facultyId: facultyId ? Number(facultyId) : undefined,
        search:    search?.trim() || undefined,
        type:      type?.trim()   || undefined,
        page:      parsedPage,
        limit:     parsedLimit,
      };

      const { departments, total } =
        await DepartmentService.getAllDepartments(filters);

      return res.status(200).json({
        success: true,
        count:   departments.length,
        total,
        page:    parsedPage,
        limit:   parsedLimit,
        departments,
      });
    } catch (error) {
      console.error("GET_ALL_DEPARTMENTS_CONTROLLER_CRASH:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }

  /**
   * GET /api/v1/departments/:id
   */
  static async getDepartmentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await DepartmentService.getDepartmentById(Number(id));

      if (result.ok) {
        return res.status(200).json({
          success: true,
          data:    result.data,
        });
      }

      switch (result.reason) {
        case "DEPARTMENT_NOT_FOUND":
          return res.status(404).json({
            success: false,
            message: "The requested department does not exist.",
            reason:  result.reason,
          });
        default:
          return res.status(400).json({
            success: false,
            message: "Failed to retrieve department.",
          });
      }
    } catch (error) {
      console.error("GET_DEPARTMENT_BY_ID_CONTROLLER_CRASH:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }

  /**
   * POST /api/v1/departments
   */
  static async createDepartment(req: Request, res: Response) {
    try {
      const result = await DepartmentService.createDepartment(req.body);

      if (result.ok) {
        return res.status(201).json({
          success: true,
          message: "Department created successfully.",
          data:    result.data,
        });
      }

      switch (result.reason) {
        case "FACULTY_NOT_FOUND":
          return res.status(404).json({
            success: false,
            message: "The specified faculty does not exist.",
            reason:  result.reason,
          });
        case "DEPARTMENT_ALREADY_EXISTS":
          return res.status(409).json({
            success: false,
            message: "A department with this name or code already exists.",
            reason:  result.reason,
          });
        default:
          return res.status(400).json({
            success: false,
            message: "Failed to create department.",
          });
      }
    } catch (error) {
      console.error("CREATE_DEPARTMENT_CONTROLLER_CRASH:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }

  /**
   * PATCH /api/v1/departments/:id
   */
  static async updateDepartment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await DepartmentService.updateDepartment(
        Number(id),
        req.body
      );

      if (result.ok) {
        return res.status(200).json({
          success: true,
          message: "Department updated successfully.",
          data:    result.data,
        });
      }

      switch (result.reason) {
        case "DEPARTMENT_NOT_FOUND":
          return res.status(404).json({
            success: false,
            message: "The department you are trying to update does not exist.",
            reason:  result.reason,
          });
        case "FACULTY_NOT_FOUND":
          return res.status(404).json({
            success: false,
            message: "The specified faculty does not exist.",
            reason:  result.reason,
          });
        case "DEPARTMENT_CODE_TAKEN":
          return res.status(409).json({
            success: false,
            message: "A department with this code already exists.",
            reason:  result.reason,
          });
        case "DEPARTMENT_NAME_TAKEN":
          return res.status(409).json({
            success: false,
            message: "A department with this name already exists.",
            reason:  result.reason,
          });
        default:
          return res.status(400).json({
            success: false,
            message: "Failed to update department.",
          });
      }
    } catch (error) {
      console.error("UPDATE_DEPARTMENT_CONTROLLER_CRASH:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }

  /**
   * DELETE /api/v1/departments/:id
   */
  static async deleteDepartment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await DepartmentService.deleteDepartment(Number(id));

      if (result.ok) {
        return res.status(200).json({
          success: true,
          message: "Department deleted successfully.",
        });
      }

      switch (result.reason) {
        case "DEPARTMENT_NOT_FOUND":
          return res.status(404).json({
            success: false,
            message: "The department you are trying to delete does not exist.",
            reason:  result.reason,
          });
        default:
          return res.status(400).json({
            success: false,
            message: "Failed to delete department.",
          });
      }
    } catch (error) {
      console.error("DELETE_DEPARTMENT_CONTROLLER_CRASH:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }
}