import { Op } from 'sequelize';
import db from "../models/index.ts";
import type {
  CreateOrganisationInput,
  UpdateOrganisationInput,
} from '../validators/organisation.schema.ts';

type OrganisationReason =
  | "ORGANISATION_ALREADY_EXISTS"
  | "FACULTY_NOT_FOUND"
  | "DEPARTMENT_NOT_FOUND"
  | "ORGANISATION_NOT_FOUND";

type OrganisationResult<T = unknown> = {
  ok:      boolean;
  data?:   T;
  reason?: OrganisationReason;
};

interface OrganisationFilters {
  name?:          string;
  faculty_id?:    number;
  department_id?: number;
  page:           number;
  limit:          number;
}

interface PaginatedOrganisations {
  organisations: ReturnType<typeof db.Organisation.build>[];
  total:         number;
}


export class OrganisationService {
  /**
   * Fetch all organisations with optional filters and pagination.
   */
  static async getAllOrganisations(
    filters: OrganisationFilters
  ): Promise<PaginatedOrganisations> {
    const { name, faculty_id, department_id, page, limit } = filters;

    const where: Record<string, unknown> = {};

    if (name)          where.name          = { [Op.iLike]: `%${name}%` };
    if (faculty_id)    where.faculty_id    = faculty_id;
    if (department_id) where.department_id = department_id;

    const { rows: organisations, count: total } =
      await db.Organisation.findAndCountAll({
        where,
        include: [
          { model: db.Faculty,    as: 'faculty',    attributes: ['id', 'name'] },
          { model: db.Department, as: 'department', attributes: ['id', 'name'] },
        ],
        order:    [['created_at', 'DESC']],
        limit,
        offset:   (page - 1) * limit,
        distinct: true,
      });

    return { organisations, total };
  }

  /**
   * Fetch a single organisation by primary key.
   */
  static async getOrganisationById(id: number): Promise<OrganisationResult> {
    const organisation = await db.Organisation.findByPk(id, {
      include: [
        { model: db.Faculty,    as: 'faculty',    attributes: ['id', 'name'] },
        { model: db.Department, as: 'department', attributes: ['id', 'name'] },
      ],
    });

    if (!organisation) return { ok: false, reason: "ORGANISATION_NOT_FOUND" };
    return { ok: true, data: organisation };
  }

  /**
   * Create a new organisation with existence and FK checks.
   */
  static async createOrganisation(
    data: CreateOrganisationInput
  ): Promise<OrganisationResult> {
    try {
      if (data.faculty_id) {
        const faculty = await db.Faculty.findByPk(data.faculty_id);
        if (!faculty) return { ok: false, reason: "FACULTY_NOT_FOUND" };
      }

      if (data.department_id) {
        const department = await db.Department.findByPk(data.department_id);
        if (!department) return { ok: false, reason: "DEPARTMENT_NOT_FOUND" };
      }

      const existing = await db.Organisation.findOne({
        where: { name: { [Op.iLike]: data.name.trim() } },
      });
      if (existing) return { ok: false, reason: "ORGANISATION_ALREADY_EXISTS" };

      const organisation = await db.Organisation.create({
        name:          data.name,
        faculty_id:    data.faculty_id    ?? null,
        department_id: data.department_id ?? null,
      });

      return { ok: true, data: organisation };
    } catch (error) {
      console.error("CREATE_ORGANISATION_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Update an existing organisation.
   */
  static async updateOrganisation(
    id:   number,
    data: UpdateOrganisationInput
  ): Promise<OrganisationResult> {
    try {
      const organisation = await db.Organisation.findByPk(id);
      if (!organisation) return { ok: false, reason: "ORGANISATION_NOT_FOUND" };

      if (data.faculty_id) {
        const faculty = await db.Faculty.findByPk(data.faculty_id);
        if (!faculty) return { ok: false, reason: "FACULTY_NOT_FOUND" };
      }

      if (data.department_id) {
        const department = await db.Department.findByPk(data.department_id);
        if (!department) return { ok: false, reason: "DEPARTMENT_NOT_FOUND" };
      }

      if (data.name) {
        const existing = await db.Organisation.findOne({
          where: {
            name: { [Op.iLike]: data.name.trim() },
            id:   { [Op.ne]: id },
          },
        });
        if (existing) return { ok: false, reason: "ORGANISATION_ALREADY_EXISTS" };
      }

      await organisation.update({
        ...(data.name          !== undefined && { name:          data.name }),
        ...(data.faculty_id    !== undefined && { faculty_id:    data.faculty_id }),
        ...(data.department_id !== undefined && { department_id: data.department_id }),
      });

      const updated = await organisation.reload({
        include: [
          { model: db.Faculty,    as: 'faculty',    attributes: ['id', 'name'] },
          { model: db.Department, as: 'department', attributes: ['id', 'name'] },
        ],
      });

      return { ok: true, data: updated };
    } catch (error) {
      console.error("UPDATE_ORGANISATION_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Delete an organisation by ID.
   */
  static async deleteOrganisation(id: number): Promise<OrganisationResult> {
    try {
      const organisation = await db.Organisation.findByPk(id);
      if (!organisation) return { ok: false, reason: "ORGANISATION_NOT_FOUND" };

      await organisation.destroy();
      return { ok: true };
    } catch (error) {
      console.error("DELETE_ORGANISATION_SERVICE_ERROR:", error);
      throw error;
    }
  }
}