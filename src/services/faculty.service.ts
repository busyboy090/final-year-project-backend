import db from "../models/index.ts";

/**
 * Result type for Faculty operations to provide 
 * consistent responses to the controller.
 */
type FacultyResult = {
  ok: boolean;
  data?: any;
  reason?: "FACULTY_ALREADY_EXISTS" | "FACULTY_NOT_FOUND" | "DATABASE_ERROR";
};

export class FacultyService {
  /**
   * Fetch all faculties with their associated departments.
   * Useful for population dropdowns in the User Profile or Event Creation forms.
   */
  static async getAllFaculties(): Promise<any[]> {
    try {
      return await db.Faculty.findAll({
        include: [{
          model: db.Department,
          as: 'departments'
        }],
        order: [['name', 'ASC']]
      });
    } catch (error) {
      console.error("GET_ALL_FACULTIES_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Get a single faculty by ID.
   */
  static async getFacultyById(id: number): Promise<any | null> {
    try {
      return await db.Faculty.findByPk(id, { 
        include: [{
          model: db.Department,
          as: 'departments'
        }] 
      });
    } catch (error) {
      console.error("GET_FACULTY_BY_ID_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Create a new faculty with an explicit existence check.
   * Prevents duplicate Faculty codes (e.g., 'SCI', 'LAW') or names.
   */
  static async createFaculty(data: { name: string; code: string }): Promise<FacultyResult> {
    try {
      // 1. Check if faculty with the same code or name already exists
      const existingFaculty = await db.Faculty.findOne({
        where: {
          [db.Sequelize.Op.or]: [
            { code: data.code },
            { name: data.name }
          ]
        }
      });

      if (existingFaculty) {
        return { ok: false, reason: "FACULTY_ALREADY_EXISTS" };
      }

      // 2. Proceed with creation if unique
      const newFaculty = await db.Faculty.create(data);
      
      return { 
        ok: true, 
        data: newFaculty 
      };
      
    } catch (error) {
      console.error("CREATE_FACULTY_SERVICE_ERROR:", error);
      // We throw the actual error to be caught by the controller's catch block
      // as a 500 Internal Server Error.
      throw error;
    }
  }
}