import db from "../models/index.ts";

type FacultyResult = {
  ok: boolean;
  data?: any;
  reason?: 
    | "FACULTY_ALREADY_EXISTS" 
    | "FACULTY_NOT_FOUND" 
    | "FACULTY_CODE_TAKEN"
    | "FACULTY_NAME_TAKEN"
    | "DATABASE_ERROR";
};

export class FacultyService {
  /**
   * Fetch all faculties with their associated departments.
   */
  static async getAllFaculties(): Promise<any[]> {
    try {
      return await db.Faculty.findAll({
        include: [{ model: db.Department, as: "departments" }],
        order: [["name", "ASC"]],
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
        include: [{ model: db.Department, as: "departments" }],
      });
    } catch (error) {
      console.error("GET_FACULTY_BY_ID_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Create a new faculty.
   * Prevents duplicate codes (e.g. 'SCI', 'LAW') or names.
   */
  static async createFaculty(data: {
    name: string;
    code: string;
  }): Promise<FacultyResult> {
    try {
      const existing = await db.Faculty.findOne({
        where: {
          [db.Sequelize.Op.or]: [{ code: data.code }, { name: data.name }],
        },
      });

      if (existing) {
        return { ok: false, reason: "FACULTY_ALREADY_EXISTS" };
      }

      const newFaculty = await db.Faculty.create(data);
      return { ok: true, data: newFaculty };
    } catch (error) {
      console.error("CREATE_FACULTY_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Update a faculty's name and/or code.
   * Checks that the target faculty exists, then ensures the incoming
   * name/code values are not already taken by a *different* faculty.
   */
  static async updateFaculty(
    id: number,
    data: Partial<{ name: string; code: string }>
  ): Promise<FacultyResult> {
    try {
      // 1. Confirm the faculty being updated exists
      const faculty = await db.Faculty.findByPk(id);
      if (!faculty) {
        return { ok: false, reason: "FACULTY_NOT_FOUND" };
      }

      // 2. Build conflict conditions only for fields that are actually changing
      const conflictConditions: object[] = [];

      if (data.code && data.code !== faculty.code) {
        conflictConditions.push({ code: data.code });
      }
      if (data.name && data.name !== faculty.name) {
        conflictConditions.push({ name: data.name });
      }

      // 3. Only run the uniqueness check if there's something to check
      if (conflictConditions.length > 0) {
        const conflict = await db.Faculty.findOne({
          where: {
            id: { [db.Sequelize.Op.ne]: id }, // exclude current record
            [db.Sequelize.Op.or]: conflictConditions,
          },
        });

        if (conflict) {
          // Surface the specific conflict so the controller can return
          // a helpful 409 message to the client.
          const isCodeConflict = data.code && conflict.code === data.code;
          return {
            ok: false,
            reason: isCodeConflict ? "FACULTY_CODE_TAKEN" : "FACULTY_NAME_TAKEN",
          };
        }
      }

      // 4. Apply the update
      await faculty.update(data);
      return { ok: true, data: faculty };
    } catch (error) {
      console.error("UPDATE_FACULTY_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Delete a faculty by ID.
   * Only deletes if the faculty exists; leaves cascade behaviour to the DB
   * (departments with a FK on faculty_id will be handled by the constraint).
   */
  static async deleteFaculty(id: number): Promise<FacultyResult> {
    try {
      const faculty = await db.Faculty.findByPk(id);

      if (!faculty) {
        return { ok: false, reason: "FACULTY_NOT_FOUND" };
      }

      await faculty.destroy();
      return { ok: true };
    } catch (error) {
      console.error("DELETE_FACULTY_SERVICE_ERROR:", error);
      throw error;
    }
  }
}