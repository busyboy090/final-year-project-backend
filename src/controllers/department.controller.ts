import type { Request, Response } from "express";
import db from "../models/index.ts";

export class DepartmentController {
  /**
   * Fetch all departments
   * Optional Query: ?faculty_id=1 to filter departments by a specific faculty
   */
  static async getAllDepartments(req: Request, res: Response) {
    try {
      const { faculty_id } = req.query;
      const whereClause: any = {};

      if (faculty_id) {
        whereClause.faculty_id = faculty_id;
      }

      const departments = await db.Department.findAll({
        where: whereClause,
        include: [
          {
            model: db.Faculty,
            as: "faculty",
            attributes: ["id", "name"],
          },
        ],
        attributes: ["id", "name", "faculty_id"],
        order: [["name", "ASC"]],
      });

      return res.status(200).json(departments);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch departments",
        error: error.message,
      });
    }
  }

  /**
   * Get a single department with its associated faculty
   */
  static async getDepartmentById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const department = await db.Department.findByPk(id, {
        include: [{ model: db.Faculty, as: "faculty", attributes: ["name"] }],
      });

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      return res.status(200).json(department);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error retrieving department",
        error: error.message,
      });
    }
  }

  /**
   * Create a new department
   * Admin / Faculty Admin only
   */
  static async createDepartment(req: Request, res: Response) {
    try {
      const { name, faculty_id, description } = req.body;

      // Basic validation
      if (!name || !faculty_id) {
        return res.status(400).json({
          success: false,
          message: "Name and Faculty ID are required",
        });
      }

      // Check if faculty exists
      const faculty = await db.Faculty.findByPk(faculty_id);
      if (!faculty) {
        return res.status(404).json({
          success: false,
          message: "Assigned Faculty not found",
        });
      }

      const newDepartment = await db.Department.create({
        name,
        faculty_id,
        description,
      });

      return res.status(201).json({
        success: true,
        message: "Department created successfully",
        data: newDepartment,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to create department",
        error: error.message,
      });
    }
  }

  /**
   * Update department details
   */
  static async updateDepartment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, faculty_id, description } = req.body;

      const department = await db.Department.findByPk(id);

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      await department.update({
        name: name || department.name,
        faculty_id: faculty_id || department.faculty_id,
        description: description || department.description,
      });

      return res.status(200).json({
        success: true,
        message: "Department updated successfully",
        data: department,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to update department",
        error: error.message,
      });
    }
  }

  /**
   * Delete a department
   */
  static async deleteDepartment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const department = await db.Department.findByPk(id);

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      await department.destroy();

      return res.status(200).json({
        success: true,
        message: "Department deleted successfully",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error deleting department",
        error: error.message,
      });
    }
  }
}