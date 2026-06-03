import db from "../models/index.ts";
import { Op } from "sequelize";
import type {
  CreateVenueInput,
  UpdateVenueInput,
} from "../validators/venue.schema.ts";

type VenueResult = {
  ok: boolean;
  data?: any;
  reason?: "VENUE_NOT_FOUND" | "DATABASE_ERROR" | "ALREADY_EXISTS";
  pagination?: any;
};

interface GetAllVenuesArgs {
  minCapacity?: number;
  limit?: number;
  page?: number;
  search?: string;
  status?: string; // Added status
  type?: string; // Added type
}

export class VenueService {
  /**
   * Helper to fetch a venue with its full nested facility relations
   */
  private static async getFullVenue(id: number, transaction?: any) {
    return await db.Venue.findByPk(id, {
      transaction,
      include: [
        {
          model: db.VenueFacility,
          as: "venueFacilities",
          include: [{ model: db.Facility, as: "facility" }],
        },
      ],
    });
  }

  /**
   * Creates a new university venue and its associated facilities
   */
  static async createVenue(
    data: CreateVenueInput["body"],
  ): Promise<VenueResult> {
    const t = await db.sequelize.transaction();
    try {
      const { features, ...venueData } = data;

      // 1. Duplicate Check
      const existingVenue = await db.Venue.findOne({
        where: { name: data.name },
      });
      if (existingVenue) {
        await t.rollback();
        return { ok: false, reason: "ALREADY_EXISTS" };
      }

      // 2. Create Venue
      const newVenue = await db.Venue.create(venueData, { transaction: t });

      // 3. Link Facilities (features)
      if (features && features.length > 0) {
        const facilityLinks = features.map((facilityId: string) => ({
          venue_id: newVenue.id,
          facility_id: facilityId,
        }));
        await db.VenueFacility.bulkCreate(facilityLinks, { transaction: t });
      }

      await t.commit();
      const result = await this.getFullVenue(newVenue.id);
      return { ok: true, data: result };
    } catch (error) {
      await t.rollback();
      console.error("CREATE_VENUE_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Updates an existing venue and synchronizes its facilities
   */
  static async updateVenue(
    id: number,
    data: Partial<UpdateVenueInput["body"]>,
  ): Promise<VenueResult> {
    const t = await db.sequelize.transaction();
    try {
      const venue = await db.Venue.findByPk(id, { transaction: t });
      if (!venue) {
        await t.rollback();
        return { ok: false, reason: "VENUE_NOT_FOUND" };
      }

      const { features, ...venueUpdateData } = data;

      // 1. Update core venue attributes
      await venue.update(venueUpdateData, { transaction: t });

      // 2. Sync Facilities (Overwrite strategy)
      if (features) {
        // Remove existing associations
        await db.VenueFacility.destroy({
          where: { venue_id: id },
          transaction: t,
        });

        // Add new associations
        if (features.length > 0) {
          const facilityLinks = features.map((facilityId: string) => ({
            venue_id: id,
            facility_id: facilityId,
          }));
          await db.VenueFacility.bulkCreate(facilityLinks, { transaction: t });
        }
      }

      await t.commit();
      const updated = await this.getFullVenue(id);
      return { ok: true, data: updated };
    } catch (error) {
      await t.rollback();
      console.error("UPDATE_VENUE_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Fetches all university venues with active associations
   */
  static async getAllVenues({
    minCapacity,
    limit = 10,
    page = 1,
    search,
    status,
    type,
  }: GetAllVenuesArgs): Promise<VenueResult> {
    try {
      const offset = (page - 1) * limit;
      const whereClause: any = {};

      // 1. Capacity Filter
      if (minCapacity) {
        whereClause.capacity = { [Op.gte]: minCapacity };
      }

      // 2. Search Filter (Case-insensitive name search)
      if (search) {
        whereClause.name = { [Op.iLike]: `%${search}%` }; // Use [Op.like] if on MySQL
      }

      // 3. Status ENUM Filter
      if (status) {
        whereClause.status = status;
      }

      // 4. Type ENUM Filter
      if (type) {
        whereClause.type = type;
      }

      // Execute query
      const { count, rows } = await db.Venue.findAndCountAll({
        where: whereClause,
        limit: limit,
        offset: offset,
        order: [["name", "ASC"]],
        distinct: true,
        include: [
          {
            model: db.VenueFacility,
            as: "venueFacilities",
            include: [{ model: db.Facility, as: "facility" }],
          },
        ],
      });

      const totalPages = Math.ceil(count / limit);

      return {
        ok: true,
        data: rows,
        pagination: {
          totalItems: count,
          totalPages: totalPages,
          currentPage: page,
          limit: limit,
        },
      };
    } catch (error) {
      console.error("GET_ALL_VENUES_SERVICE_ERROR:", error);
      throw error;
    }
  }

  static async getVenueById(id: number): Promise<VenueResult> {
    try {
      const venue = await this.getFullVenue(id);
      if (!venue) return { ok: false, reason: "VENUE_NOT_FOUND" };
      return { ok: true, data: venue };
    } catch (error) {
      console.error("GET_VENUE_BY_ID_SERVICE_ERROR:", error);
      throw error;
    }
  }

  static async updateVenueStatus(
    id: number,
    status: string,
  ): Promise<VenueResult> {
    try {
      const venue = await db.Venue.findByPk(id);
      if (!venue) return { ok: false, reason: "VENUE_NOT_FOUND" };
      await venue.update({ status });
      return { ok: true, data: venue };
    } catch (error) {
      console.error("UPDATE_STATUS_SERVICE_ERROR:", error);
      throw error;
    }
  }

  static async isVenueAvailable(
    venueId: number,
    startDate: Date,
    endDate: Date,
    excludeEventId?: number
  ): Promise<boolean> {
    const where: any = {
      venue_id: venueId,
      status: { [Op.ne]: "rejected" },
      [Op.or]: [
        { start_date: { [Op.between]: [startDate, endDate] } },
        { end_date: { [Op.between]: [startDate, endDate] } },
        {
          [Op.and]: [
            { start_date: { [Op.lte]: startDate } },
            { end_date: { [Op.gte]: endDate } },
          ],
        },
      ],
    };

    // Exclude current event from conflict check during updates
    if (excludeEventId) {
      where.id = { [Op.ne]: excludeEventId };
    }

    const conflictingEvent = await db.Event.findOne({ where });
    return !conflictingEvent;
  }

  // Delete Venue
}
