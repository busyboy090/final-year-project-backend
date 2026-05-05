import type { Request, Response } from "express";
import { DepartmentService } from "../services/department.service.ts";

export class DepartmentController {
  static async getAllDepartments(req: Request, res: Response) {
    try {
      const { facultyId } = req.query;
      let departments;

      if (facultyId) {
        departments = await DepartmentService.getDepartmentsByFaculty(Number(facultyId));
      } else {
        departments = await DepartmentService.getAllDepartments();
      }

      return res.status(200).json({
        success: true,
        count: departments.length,
        data: departments,
      });
    } catch (error) {
      console.error("GET_ALL_DEPARTMENTS_CONTROLLER_CRASH:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async createDepartment(req: Request, res: Response) {
    try {
      const result = await DepartmentService.createDepartment(req.body);

      if (result.ok) {
        return res.status(201).json({
          success: true,
          message: "Department created successfully.",
          data: result.data
        });
      }

      switch (result.reason) {
        case "FACULTY_NOT_FOUND":
          return res.status(404).json({ success: false, message: "The specified faculty does not exist." });
        case "DEPARTMENT_ALREADY_EXISTS":
          return res.status(409).json({ success: false, message: "A department with this name or code already exists." });
        default:
          return res.status(400).json({ success: false, message: "Failed to create department." });
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
}