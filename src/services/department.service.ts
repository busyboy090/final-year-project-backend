import { Op } from "sequelize";
import db from "../models/index.ts";


type DepartmentReason =
  | "DEPARTMENT_ALREADY_EXISTS"
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
  facultyId?: number;
}


export class DepartmentService {
  /**
   * Fetch all departments with faculty details.
   * Supports filtering by facultyId, search (name), and type, plus pagination.
   */
  static async getAllDepartments(
    filters: DepartmentFilters
  ): Promise<PaginatedDepartments> {
    const { facultyId, search, type, page, limit } = filters;

    const where: Record<string, unknown> = {};

    if (facultyId) where.faculty_id = facultyId;
    if (type)      where.type        = type;

    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
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
   * Create a new department with an existence check.
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

      const newDept = await db.Department.create(data);
      return { ok: true, data: newDept };
    } catch (error) {
      console.error("CREATE_DEPARTMENT_SERVICE_ERROR:", error);
      throw error;
    }
  }
}