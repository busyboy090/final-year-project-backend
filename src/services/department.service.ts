import db from '../models/index.ts';
import { Op } from 'sequelize';

/**
 * Result type for Department operations
 */
type DepartmentResult = {
  ok: boolean;
  data?: any;
  reason?: "DEPARTMENT_ALREADY_EXISTS" | "FACULTY_NOT_FOUND" | "DEPARTMENT_NOT_FOUND";
};

export class DepartmentService {
  /**
   * Fetch all departments with faculty details
   */
  static async getAllDepartments(): Promise<any[]> {
    return await db.Department.findAll({
      include: [{ model: db.Faculty, as: 'faculty' }],
      order: [['name', 'ASC']]
    });
  }

  /**
   * Get all departments belonging to a specific faculty
   */
  static async getDepartmentsByFaculty(facultyId: number): Promise<any[]> {
    return await db.Department.findAll({
      where: { facultyId },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Create a new department with an existence check
   */
  static async createDepartment(data: { name: string; code: string; facultyId: number }): Promise<DepartmentResult> {
    try {
      // 1. Verify Faculty exists
      const faculty = await db.Faculty.findByPk(data.facultyId);
      if (!faculty) return { ok: false, reason: "FACULTY_NOT_FOUND" };

      // 2. Check for duplicate code or name within the university
      const existingDept = await db.Department.findOne({
        where: {
          [Op.or]: [{ code: data.code }, { name: data.name }]
        }
      });

      if (existingDept) return { ok: false, reason: "DEPARTMENT_ALREADY_EXISTS" };

      const newDept = await db.Department.create(data);
      return { ok: true, data: newDept };
    } catch (error) {
      console.error("CREATE_DEPARTMENT_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Search departments by name
   */
  static async searchDepartments(query: string): Promise<any[]> {
    return await db.Department.findAll({
      where: {
        name: { [Op.iLike]: `%${query}%` }
      },
      include: [{ model: db.Faculty, as: 'faculty' }]
    });
  }
}