import db from "../../models/index.ts";
import { VenueService } from "../venue.service.ts";
import { CloudinaryHelper } from "../../helpers/cloudinary.helper.ts";
import { Op, fn, col, Sequelize } from "sequelize";

// Extended EventResult type to safely handle statistical metrics payloads
type EventResult = {
  ok: boolean;
  data?: any;
  reason?:
    | "VENUE_UNAVAILABLE"
    | "VENUE_NOT_FOUND"
    | "EVENT_NOT_FOUND"
    | "INVALID_DATE_RANGE"
    | "CAPACITY_EXCEEDS_VENUE_LIMIT"
    | "UNAUTHORIZED"
    | "ORGANISER_PROFILE_NOT_FOUND";
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

      if (capacity > venue.capacity) {
        return { ok: false, reason: "CAPACITY_EXCEEDS_VENUE_LIMIT" };
      }

      const isAvailable = await VenueService.isVenueAvailable(
        venue_id,
        startTimestamp,
        endTimestamp,
      );
      if (!isAvailable) return { ok: false, reason: "VENUE_UNAVAILABLE" };

      const thumbnailUrl = await CloudinaryHelper.uploadSingle(
        payload.thumbnail,
      );

      // Explicitly define database columns instead of spreading generic payload objects
      const newEvent = await db.Event.create({
        title,
        description,
        category,
        capacity,
        thumbnail: thumbnailUrl,
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

      if (payload.thumbnail) {
        const thumbnailUrl = await CloudinaryHelper.uploadSingle(
          payload.thumbnail,
        );
        payload.thumbnail = thumbnailUrl;
      }

      const updatedEvent = await event.update(payload);
      return { ok: true, data: updatedEvent };
    } catch (error) {
      console.error("UPDATE_EVENT_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Evaluates records with unified search parameters and fallback query filters.
   * Includes itemized dynamically calculated active enrollment fill percentages.
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

      if (filters.status && ["pending", "approved", "rejected", "cancelled"].includes(filters.status)) {
        where.status = filters.status;
      }

      if (filters.category && [
        "Academic Conference", "Workshop", "Cultural Event", 
        "Sports Match", "Exhibition/Expo", "Social Gathering/Party"
      ].includes(filters.category)) {
        where.category = filters.category;
      }

      if (filters.organisation_id) where.organisation_id = filters.organisation_id;
      if (filters.venue_id) where.venue_id = filters.venue_id;

      if (filters.date) {
        where.start_date = new Date(filters.date);
      } else if (filters.start_date_from || filters.start_date_to) {
        where.start_date = {};
        if (filters.start_date_from) where.start_date[Op.gte] = new Date(filters.start_date_from);
        if (filters.start_date_to) where.start_date[Op.lte] = new Date(filters.start_date_to);
      }

      if (filters.title) {
        where.title = filters.title;
      } else if (filters.search) {
        where.title = { [Op.iLike]: `%${filters.search}%` };
      }

      const { rows, count } = await db.Event.findAndCountAll({
        where,
        attributes: {
          include: [
            // Subquery to dynamically compute the fill percentage on-the-fly
            [
              Sequelize.literal(`
                CASE 
                  WHEN "Event".capacity > 0 THEN 
                    ROUND(
                      (
                        (SELECT COUNT(*)::numeric FROM event_enrollments AS e 
                         WHERE e.event_id = "Event".id AND e.status != 'cancelled') 
                        / "Event".capacity::numeric
                      ) * 100, 1
                    )
                  ELSE 0 
                END
              `),
              "fillPercentage"
            ]
          ]
        },
        include: [
          {
            model: db.User,
            as: "creator",
            attributes: ["id", "first_name", "last_name", "email"],
          },
          {
            model: db.Venue,
            as: "venue",
            attributes: ["id", "name", "location", "capacity"],
          },
          {
            model: db.Organisation,
            as: "organisation",
            attributes: ["id", "name"],
          }
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
          total: count,
          page: Number(targetPage) || 1,
          limit,
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      console.error("GET_EVENTS_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Resolves target records by Primary Identifier Key, injecting runtime fill tracking metrics.
   */
  static async getEventById(eventId: number): Promise<EventResult> {
    try {
      const event = await db.Event.findByPk(eventId, {
        attributes: {
          include: [
            // Identical subquery for consistent single-record lookups
            [
              Sequelize.literal(`
                CASE 
                  WHEN "Event".capacity > 0 THEN 
                    ROUND(
                      (
                        (SELECT COUNT(*)::numeric FROM event_enrollments AS e 
                         WHERE e.event_id = "Event".id AND e.status != 'cancelled') 
                        / "Event".capacity::numeric
                      ) * 100, 1
                    )
                  ELSE 0 
                END
              `),
              "fillPercentage"
            ]
          ]
        },
        include: [
          {
            model: db.User,
            as: "creator",
            attributes: ["id", "first_name", "last_name", "email"],
          },
          {
            model: db.Venue,
            as: "venue",
            attributes: ["id", "name", "location", "capacity"],
          },
          {
            model: db.Organisation,
            as: "organisation",
            attributes: ["id","name"]
          }
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


  /**
   * Aggregates key system metrics for dashboards, including user demographics (staff vs students).
   */
  static async getEventStats(userId?: number): Promise<EventResult> {
    try {
      const eventWhereFilter = userId ? { created_by: userId } : {};

      // 1. Core Event Volumetrics and Status Breakdown
      const statusCounts = await db.Event.findAll({
        where: eventWhereFilter,
        attributes: ["status", [fn("COUNT", col("id")), "count"]],
        group: ["status"],
        raw: true
      }) as unknown as Array<{ status: string; count: number }>;

      let totalEvents = 0;
      const statusBreakdown: Record<string, number> = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
      statusCounts.forEach(item => {
        const count = Number(item.count);
        statusBreakdown[item.status] = count;
        totalEvents += count;
      });

      // 2. Aggregate Enrollment Volume and Real Attendance Ratios
      const enrollmentStats = await db.EventEnrollment.findAll({
        attributes: [
          [fn("COUNT", col("id")), "total"],
          [fn("SUM", Sequelize.literal("CASE WHEN status = 'attended' THEN 1 ELSE 0 END")), "attendedCount"]
        ],
        include: [{ model: db.Event, attributes: [], where: eventWhereFilter, required: true }],
        raw: true
      }) as unknown as Array<{ total: string; attendedCount: string }>;

      const totalEnrollments = Number(enrollmentStats[0]?.total || 0);
      const attendedCount = Number(enrollmentStats[0]?.attendedCount || 0);
      const attendanceRate = totalEnrollments > 0 ? `${((attendedCount / totalEnrollments) * 100).toFixed(1)}%` : "0.0%";

      // 3. Leaderboard: Top 5 Highest Performing Events
      const popularEventsRaw = await db.EventEnrollment.findAll({
        attributes: ["event_id", [fn("COUNT", col("event_enrollments.id")), "enrollmentCount"]],
        include: [{ model: db.Event, as: "event", attributes: ["title", "capacity"], where: eventWhereFilter, required: true }],
        where: { status: { [Op.not]: "cancelled" } },
        group: ["event_id", "event.id", "event.title", "event.capacity"],
        order: [[fn("COUNT", col("event_enrollments.id")), "DESC"]],
        limit: 5,
        raw: true
      }) as unknown as Array<{ event_id: number; "event.title": string; "event.capacity": number; enrollmentCount: string; }>;

      const popularEvents = popularEventsRaw.map(item => {
        const enrollments = Number(item.enrollmentCount);
        const capacity = Number(item["event.capacity"] || 0);
        return {
          id: item.event_id,
          title: item["event.title"],
          capacity,
          enrollmentCount: enrollments,
          fillPercentage: capacity > 0 ? `${((enrollments / capacity) * 100).toFixed(1)}%` : "0.0%"
        };
      });

      // 4. Overall Portfolio Capacity Metrics
      const portfolioCapacities = await db.Event.findAll({
        where: { ...eventWhereFilter, status: "approved" },
        attributes: ["id", "capacity", [Sequelize.literal(`(SELECT COUNT(*) FROM event_enrollments AS e WHERE e.event_id = "Event".id AND e.status != 'cancelled')`), "activeEnrollments"]],
        raw: true
      }) as unknown as Array<{ id: number; capacity: number; activeEnrollments: string }>;

      let totalCapacityPool = 0, totalActiveSeatsFilled = 0;
      portfolioCapacities.forEach(event => {
        totalCapacityPool += Number(event.capacity || 0);
        totalActiveSeatsFilled += Number(event.activeEnrollments || 0);
      });
      const averagePortfolioFillPercentage = totalCapacityPool > 0 ? `${((totalActiveSeatsFilled / totalCapacityPool) * 100).toFixed(1)}%` : "0.0%";

      // 5. NEW: User Demographics Breakdown (Staff vs Student)
      const demographicStats = await db.EventEnrollment.findAll({
        attributes: [
          // Total enrollments by role
          [fn("SUM", Sequelize.literal("CASE WHEN \"user\".\"role\" = 'student' THEN 1 ELSE 0 END")), "studentEnrollments"],
          [fn("SUM", Sequelize.literal("CASE WHEN \"user\".\"role\" = 'staff' THEN 1 ELSE 0 END")), "staffEnrollments"],
          // Attended instances by role
          [fn("SUM", Sequelize.literal("CASE WHEN \"user\".\"role\" = 'student' AND event_enrollments.status = 'attended' THEN 1 ELSE 0 END")), "studentAttended"],
          [fn("SUM", Sequelize.literal("CASE WHEN \"user\".\"role\" = 'staff' AND event_enrollments.status = 'attended' THEN 1 ELSE 0 END")), "staffAttended"]
        ],
        include: [
          { model: db.Event, attributes: [], where: eventWhereFilter, required: true },
          { model: db.User, as: "user", attributes: [], required: true } // Joins your user table
        ],
        raw: true
      }) as unknown as Array<{ studentEnrollments: string; staffEnrollments: string; studentAttended: string; staffAttended: string; }>;

      const studentEnrolled = Number(demographicStats[0]?.studentEnrollments || 0);
      const staffEnrolled = Number(demographicStats[0]?.staffEnrollments || 0);
      const studentAttended = Number(demographicStats[0]?.studentAttended || 0);
      const staffAttended = Number(demographicStats[0]?.staffAttended || 0);

      const demographics = {
        student: {
          enrollments: studentEnrolled,
          attendanceRate: studentEnrolled > 0 ? `${((studentAttended / studentEnrolled) * 100).toFixed(1)}%` : "0.0%"
        },
        staff: {
          enrollments: staffEnrolled,
          attendanceRate: staffEnrolled > 0 ? `${((staffAttended / staffEnrolled) * 100).toFixed(1)}%` : "0.0%"
        }
      };

      return {
        ok: true,
        data: {
          totalEvents,
          statusBreakdown,
          totalEnrollments,
          attendanceRate,
          averagePortfolioFillPercentage,
          demographics, // New demographics object added here
          popularEvents
        }
      };
    } catch (error) {
      console.error("GET_EVENT_STATS_SERVICE_ERROR:", error);
      throw error;
    }
  }
}