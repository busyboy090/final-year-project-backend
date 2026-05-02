import db from '../models/index.ts';

export class DepartmentService {
  /**
   * Fetch all departments
   */
  static async getAllDepartments() {
    return await db.Department.findAll({
      include: ['faculty'],
      order: [['name', 'ASC']]
    });
  }

  /**
   * Get all departments belonging to a specific faculty
   */
  static async getDepartmentsByFaculty(facultyId: number) {
    return await db.Department.findAll({
      where: { facultyId },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Create a new department
   */
  static async createDepartment(data: { name: string; code: string; facultyId: number }) {
    return await db.Department.create(data);
  }

  /**
   * Search departments by name (Useful for your Smart Pantry or Event projects)
   */
  static async searchDepartments(query: string) {
    const { Op } = require('sequelize');
    return await db.Department.findAll({
      where: {
        name: { [Op.iLike]: `%${query}%` }
      }
    });
  }
}