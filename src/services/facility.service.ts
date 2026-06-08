import { Op } from "sequelize";
import db from "../models/index.ts";
import type { CreateFacilityInput, UpdateFacilityInput } from "../validators/facility.schema.ts";

type FacilityReason =
  | "ALREADY_EXISTS"
  | "FACILITY_NOT_FOUND"
  | "FACILITY_NAME_TAKEN";

type FacilityResult<T = unknown> = {
  ok:      boolean;
  data?:   T;
  reason?: FacilityReason;
};

interface FacilityFilters {
  search?: string;
  page:    number;
  limit:   number;
}

interface PaginatedFacilities {
  facilities: ReturnType<typeof db.Facility.build>[];
  total:      number;
}

type FacilityInstance = ReturnType<typeof db.Facility.build>;

export class FacilityService {
  /**
   * Fetches all registered facilities with optional search and pagination.
   */
  static async getAllFacilities(
    filters: FacilityFilters
  ): Promise<PaginatedFacilities> {
    try {
      const { search, page, limit } = filters;
      const where: Record<string, unknown> = {};

      if (search) {
        where.name = { [Op.iLike]: `%${search}%` };
      }

      const { rows: facilities, count: total } =
        await db.Facility.findAndCountAll({
          where,
          order:  [["name", "ASC"]],
          limit,
          offset: (page - 1) * limit,
        });

      return { facilities, total };
    } catch (error) {
      console.error("GET_ALL_FACILITIES_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Creates a new facility asset.
   */
  static async createFacility(
    data: CreateFacilityInput['body']
  ): Promise<FacilityResult<FacilityInstance>> {
    try {
      const exists = await db.Facility.findOne({ where: { name: data.name } });
      if (exists) return { ok: false, reason: "ALREADY_EXISTS" };

      const facility = await db.Facility.create(data);
      return { ok: true, data: facility };
    } catch (error) {
      console.error("CREATE_FACILITY_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Targeted fetch for a single facility.
   */
  static async getFacilityById(id: number): Promise<FacilityResult<FacilityInstance>> {
    try {
      const facility = await db.Facility.findByPk(id);
      if (!facility) return { ok: false, reason: "FACILITY_NOT_FOUND" };
      return { ok: true, data: facility };
    } catch (error) {
      console.error("GET_FACILITY_BY_ID_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Updates an existing facility asset.
   * Checks name uniqueness against *other* facilities during modification.
   */
  static async updateFacility(
    id: number,
    data: Partial<UpdateFacilityInput['body']>
  ): Promise<FacilityResult<FacilityInstance>> {
    try {
      const facility = await db.Facility.findByPk(id);
      if (!facility) {
        return { ok: false, reason: "FACILITY_NOT_FOUND" };
      }

      if (data.name && data.name !== facility.name) {
        const conflict = await db.Facility.findOne({
          where: {
            id: { [Op.ne]: id },
            name: data.name,
          },
        });

        if (conflict) {
          return { ok: false, reason: "FACILITY_NAME_TAKEN" };
        }
      }

      const updatedFacility = await facility.update(data);
      return { ok: true, data: updatedFacility };
    } catch (error) {
      console.error("UPDATE_FACILITY_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Delete a facility by ID.
   */
  static async deleteFacility(id: number): Promise<FacilityResult<void>> {
    try {
      const facility = await db.Facility.findByPk(id);
      if (!facility) return { ok: false, reason: "FACILITY_NOT_FOUND" };

      await facility.destroy();
      return { ok: true };
    } catch (error) {
      console.error("DELETE_FACILITY_SERVICE_ERROR:", error);
      throw error;
    }
  }
}