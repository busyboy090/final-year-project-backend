import db from "../../models/index.ts";
import { VenueService } from "../venue.service.ts";

type EventResult = {
  ok: boolean;
  data?: any;
  reason?:
    | "VENUE_UNAVAILABLE"
    | "VENUE_NOT_FOUND"
    | "EVENT_NOT_FOUND"
    | "INVALID_DATE_RANGE"
    | "UNAUTHORIZED";
};

export class EventService {
  /**
   * Creates a new event application after validating infrastructure resources
   */
  static async createEvent(payload: any, userId: number): Promise<EventResult> {
    try {
      const {
        venue_id,
        start_date,
        end_date,
        title,
        description,
        category,
        capacity,
        duration,
      } = payload;

      const organiserProfile = await db.EventOrganiserProfile.findOne({
        where: { user_id: userId },
      });
      const organisation_id = organiserProfile?.organisation_id ?? null;

      // Ensure we are comparing real timestamp values safely
      const startTimestamp = new Date(start_date);
      const endTimestamp = new Date(end_date);

      if (startTimestamp >= endTimestamp) {
        return { ok: false, reason: "INVALID_DATE_RANGE" };
      }

      const venue = await db.Venue.findByPk(venue_id);
      if (!venue) return { ok: false, reason: "VENUE_NOT_FOUND" };

      const isAvailable = await VenueService.isVenueAvailable(
        venue_id,
        startTimestamp,
        endTimestamp,
      );
      if (!isAvailable) return { ok: false, reason: "VENUE_UNAVAILABLE" };

      // Explicitly define database columns instead of spreading generic payload objects
      const newEvent = await db.Event.create({
        title,
        description,
        category,
        capacity,
        duration,
        venue_id,
        start_date: startTimestamp,
        end_date: endTimestamp,
        organisation_id,
        created_by: userId,
        status: "pending",
      });

      return { ok: true, data: newEvent };
    } catch (error) {
      console.error("CREATE_EVENT_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Updates core variables and re-validates schedule if calendar dates shift
   */
  static async updateEvent(
    eventId: number,
    payload: any,
    userId: number,
  ): Promise<EventResult> {
    try {
      const event = await db.Event.findByPk(eventId);
      if (!event) return { ok: false, reason: "EVENT_NOT_FOUND" };

      if (event.created_by !== userId) {
        return { ok: false, reason: "UNAUTHORIZED" };
      }

      const newVenueId = payload.venue_id || event.venue_id;
      const newStart = payload.start_date
        ? new Date(payload.start_date)
        : new Date(event.start_date);
      const newEnd = payload.end_date
        ? new Date(payload.end_date)
        : new Date(event.end_date);

      if (payload.start_date || payload.end_date || payload.venue_id) {
        if (newStart >= newEnd)
          return { ok: false, reason: "INVALID_DATE_RANGE" };

        const isAvailable = await VenueService.isVenueAvailable(
          newVenueId,
          newStart,
          newEnd,
          eventId,
        );
        if (!isAvailable) return { ok: false, reason: "VENUE_UNAVAILABLE" };
      }

      const updatedEvent = await event.update(payload);
      return { ok: true, data: updatedEvent };
    } catch (error) {
      console.error("UPDATE_EVENT_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Evaluates records with unified search parameters and fallback query filters
   */
  static async getAllEvents(
    filters: any = {},
    pagination: any = {},
  ): Promise<EventResult> {
    try {
      const targetLimit = pagination.limit || filters.limit || 10;
      const targetPage = pagination.page || filters.page || 1;

      const limit = Math.min(Number(targetLimit) || 10, 100);
      const offset = ((Number(targetPage) || 1) - 1) * limit;

      const where: any = {};

      if (
        filters.status &&
        ["pending", "approved", "rejected", "cancelled"].includes(
          filters.status,
        )
      ) {
        where.status = filters.status;
      }

      if (
        filters.category &&
        [
          "Academic Conference",
          "Workshop",
          "Cultural Event",
          "Sports Match",
          "Exhibition/Expo",
          "Social Gathering/Party",
        ].includes(filters.category)
      ) {
        where.category = filters.category;
      }

      if (filters.organisation_id)
        where.organisation_id = filters.organisation_id;
      if (filters.venue) where.venue_id = filters.venue;

      if (filters.date) {
        where.start_date = new Date(filters.date);
      } else if (filters.start_date_from || filters.start_date_to) {
        where.start_date = {};
        if (filters.start_date_from)
          where.start_date[db.Sequelize.Op.gte] = new Date(
            filters.start_date_from,
          );
        if (filters.start_date_to)
          where.start_date[db.Sequelize.Op.lte] = new Date(
            filters.start_date_to,
          );
      }

      if (filters.title) {
        where.title = filters.title;
      } else if (filters.search) {
        where.title = { [db.Sequelize.Op.iLike]: `%${filters.search}%` };
      }
      if (filters.department) where.department = filters.department;

      const { rows, count } = await db.Event.findAndCountAll({
        where,
        include: [
          {
            model: db.User,
            as: "creator",
            attributes: ["id", "first_name", "last_name", "email"],
          },
          {
            model: db.Venue,
            as: "eventVenue",
            attributes: ["id", "name", "location", "capacity"],
          },
        ],
        order: [["start_date", "ASC"]],
        limit,
        offset,
        distinct: true,
      });

      return {
        ok: true,
        data: {
          events: rows,
          pagination: {
            total: count,
            page: Number(targetPage) || 1,
            limit,
            pages: Math.ceil(count / limit),
          },
        },
      };
    } catch (error) {
      console.error("GET_EVENTS_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Resolves target records by Primary Identifier Key
   */
  static async getEventById(eventId: number): Promise<EventResult> {
    try {
      const event = await db.Event.findByPk(eventId, {
        include: [
          {
            model: db.User,
            as: "creator",
            attributes: ["id", "first_name", "last_name", "email"],
          },
          {
            model: db.Venue,
            as: "eventVenue",
            attributes: ["id", "name", "location", "capacity"],
          },
        ],
      });
      if (!event) return { ok: false, reason: "EVENT_NOT_FOUND" };
      return { ok: true, data: event };
    } catch (error) {
      console.error("GET_EVENT_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Progresses state parameters for administrative oversight operations
   */
  static async updateEventStatus(
    eventId: number,
    status: "approved" | "rejected",
  ): Promise<EventResult> {
    try {
      const event = await db.Event.findByPk(eventId);
      if (!event) return { ok: false, reason: "EVENT_NOT_FOUND" };

      await event.update({ status });
      return { ok: true, data: event };
    } catch (error) {
      console.error("UPDATE_EVENT_STATUS_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Halts workflows and frees up venue reservations
   */
  static async cancelEvent(
    eventId: number,
    userId: number,
  ): Promise<EventResult> {
    try {
      const event = await db.Event.findByPk(eventId);
      if (!event) return { ok: false, reason: "EVENT_NOT_FOUND" };

      if (event.created_by !== userId)
        return { ok: false, reason: "UNAUTHORIZED" };

      await event.update({ status: "cancelled" });
      return { ok: true, data: event };
    } catch (error) {
      console.error("CANCEL_EVENT_SERVICE_ERROR:", error);
      throw error;
    }
  }
}
