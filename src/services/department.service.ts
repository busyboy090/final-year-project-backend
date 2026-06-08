import { Op } from "sequelize";
import db from "../models/index.ts";

type DepartmentReason =
  | "DEPARTMENT_ALREADY_EXISTS"
  | "DEPARTMENT_CODE_TAKEN"
  | "DEPARTMENT_NAME_TAKEN"
  | "FACULTY_NOT_FOUND"
  | "DEPARTMENT_NOT_FOUND";

type DepartmentResult<T = unknown> = {
  ok:      boolean;
  data?:   T;
  reason?: DepartmentReason;
};

interface DepartmentFilters {
  facultyId?: number;
  search?:    string;
  type?:      string;
  page:       number;
  limit:      number;
}

interface PaginatedDepartments {
  departments: ReturnType<typeof db.Department.build>[];
  total:       number;
}

interface CreateDepartmentData {
  name:       string;
  code:       string;
  type:       string;
  facultyId?: number;
}

interface UpdateDepartmentData {
  name?:      string;
  code?:      string;
  type?:      string;
  facultyId?: number | null; // null explicitly unlinks from a faculty
}


export class DepartmentService {
  /**
   * Fetch all departments with faculty details.
   * Supports filtering by facultyId, search (name/code), type, plus pagination.
   */
  static async getAllDepartments(
    filters: DepartmentFilters
  ): Promise<PaginatedDepartments> {
    const { facultyId, search, type, page, limit } = filters;

    const where: Record<string, unknown> = {};

    if (facultyId) where.faculty_id = facultyId;
    if (type)      where.type        = type;

    if (search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows: departments, count: total } =
      await db.Department.findAndCountAll({
        where,
        include:  [{ model: db.Faculty, as: "faculty" }],
        order:    [["name", "ASC"]],
        limit,
        offset:   (page - 1) * limit,
        distinct: true,
      });

    return { departments, total };
  }

  /**
   * Get a single department by ID with its faculty.
   */
  static async getDepartmentById(id: number): Promise<DepartmentResult> {
    try {
      const department = await db.Department.findByPk(id, {
        include: [{ model: db.Faculty, as: "faculty" }],
      });

      if (!department) return { ok: false, reason: "DEPARTMENT_NOT_FOUND" };

      return { ok: true, data: department };
    } catch (error) {
      console.error("GET_DEPARTMENT_BY_ID_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Create a new department.
   * Validates the target faculty exists (if provided) before checking
   * for name/code uniqueness.
   */
  static async createDepartment(
    data: CreateDepartmentData
  ): Promise<DepartmentResult> {
    try {
      if (data.facultyId) {
        const faculty = await db.Faculty.findByPk(data.facultyId);
        if (!faculty) return { ok: false, reason: "FACULTY_NOT_FOUND" };
      }

      const existing = await db.Department.findOne({
        where: {
          [Op.or]: [{ code: data.code }, { name: data.name }],
        },
      });
      if (existing) return { ok: false, reason: "DEPARTMENT_ALREADY_EXISTS" };

      const newDept = await db.Department.create({
        name:       data.name,
        code:       data.code,
        type:       data.type,
        faculty_id: data.facultyId ?? null,
      });

      return { ok: true, data: newDept };
    } catch (error) {
      console.error("CREATE_DEPARTMENT_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Update a department.
   * - Validates the target department exists first.
   * - If facultyId is being changed, confirms the new faculty exists.
   * - Checks name/code uniqueness against *other* departments only.
   */
  static async updateDepartment(
    id: number,
    data: UpdateDepartmentData
  ): Promise<DepartmentResult> {
    try {
      const department = await db.Department.findByPk(id);
      if (!department) return { ok: false, reason: "DEPARTMENT_NOT_FOUND" };

      // Validate the incoming facultyId if it's explicitly being changed
      if (data.facultyId !== undefined && data.facultyId !== null) {
        const faculty = await db.Faculty.findByPk(data.facultyId);
        if (!faculty) return { ok: false, reason: "FACULTY_NOT_FOUND" };
      }

      // Build uniqueness conflict conditions for fields that are actually changing
      const conflictConditions: object[] = [];

      if (data.code && data.code !== department.code) {
        conflictConditions.push({ code: data.code });
      }
      if (data.name && data.name !== department.name) {
        conflictConditions.push({ name: data.name });
      }

      if (conflictConditions.length > 0) {
        const conflict = await db.Department.findOne({
          where: {
            id:           { [Op.ne]: id },
            [Op.or]:      conflictConditions,
          },
        });

        if (conflict) {
          const isCodeConflict = data.code && conflict.code === data.code;
          return {
            ok:     false,
            reason: isCodeConflict ? "DEPARTMENT_CODE_TAKEN" : "DEPARTMENT_NAME_TAKEN",
          };
        }
      }

      await department.update({
        ...(data.name      !== undefined && { name:       data.name }),
        ...(data.code      !== undefined && { code:       data.code }),
        ...(data.type      !== undefined && { type:       data.type }),
        // facultyId: undefined  → no change; null → unlinks (SET NULL); number → reassigns
        ...(data.facultyId !== undefined && { faculty_id: data.facultyId }),
      });

      return { ok: true, data: department };
    } catch (error) {
      console.error("UPDATE_DEPARTMENT_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Delete a department by ID.
   * The FK on users/events referencing this department is handled
   * by the DB constraint — no cascade logic lives here.
   */
  static async deleteDepartment(id: number): Promise<DepartmentResult> {
    try {
      const department = await db.Department.findByPk(id);
      if (!department) return { ok: false, reason: "DEPARTMENT_NOT_FOUND" };

      await department.destroy();
      return { ok: true };
    } catch (error) {
      console.error("DELETE_DEPARTMENT_SERVICE_ERROR:", error);
      throw error;
    }
  }
}