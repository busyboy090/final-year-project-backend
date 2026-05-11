import db from "../models/index.ts";
import { Op } from "sequelize";
import type { CreateVenueInput, UpdateVenueInput } from "../validators/venue.schema.ts";

type VenueResult = {
  ok: boolean;
  data?: any;
  reason?: "VENUE_NOT_FOUND" | "DATABASE_ERROR" | "ALREADY_EXISTS";
};

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
          as: 'venueFacilities',
          include: [{ model: db.Facility, as: 'facility' }]
        }
      ]
    });
  }

  /**
   * Creates a new university venue and its associated facilities
   */
  static async createVenue(data: CreateVenueInput['body']): Promise<VenueResult> {
    const t = await db.sequelize.transaction();
    try {
      const { features, ...venueData } = data;

      // 1. Duplicate Check
      const existingVenue = await db.Venue.findOne({ where: { name: data.name } });
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
          facility_id: facilityId
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
  static async updateVenue(id: number, data: Partial<UpdateVenueInput['body']>): Promise<VenueResult> {
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
        await db.VenueFacility.destroy({ where: { venue_id: id }, transaction: t });

        // Add new associations
        if (features.length > 0) {
          const facilityLinks = features.map((facilityId: string) => ({
            venue_id: id,
            facility_id: facilityId
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
  static async getAllVenues(minCapacity?: number): Promise<VenueResult> {
    try {
      const whereClause = minCapacity ? { capacity: { [Op.gte]: minCapacity } } : {};
      const venues = await db.Venue.findAll({
        where: whereClause,
        order: [['name', 'ASC']],
        include: [{
          model: db.VenueFacility,
          as: 'venueFacilities',
          include: [{ model: db.Facility, as: 'facility' }]
        }]
      });
      return { ok: true, data: venues };
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

  static async updateVenueStatus(id: number, status: string): Promise<VenueResult> {
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

  static async isVenueAvailable(venueId: number, startDate: Date, endDate: Date): Promise<boolean> {
    const conflictingEvent = await db.Event.findOne({
      where: {
        venue: venueId,
        status: { [Op.ne]: 'rejected' },
        [Op.or]: [
          { start_date: { [Op.between]: [startDate, endDate] } },
          { end_date: { [Op.between]: [startDate, endDate] } },
          {
            [Op.and]: [
              { start_date: { [Op.lte]: startDate } },
              { end_date: { [Op.gte]: endDate } }
            ]
          }
        ]
      }
    });
    return !conflictingEvent;
  }

  // Delete Venue
  
}