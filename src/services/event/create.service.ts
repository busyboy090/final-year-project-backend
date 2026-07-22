import db from "../../models/index.ts";
import { VenueService } from "../venue.service.ts";
import { CloudinaryHelper } from "../../helpers/cloudinary.helper.ts";
import { Op, Sequelize } from "sequelize";
import { sendEventCancellationEmail } from "../mail/cancellation.service.ts";
import { sendEventUpdateEmail } from "../mail/eventUpdate.service.ts";
import qrQueue from "../../queues/qrQueue.ts";
import { EventAudienceService } from "./audience.service.ts";

// Consistent human-readable date/time formatting for notification emails,
// pinned to Africa/Lagos so times match what organisers entered.
const formatEventDateTime = (date: Date | string): string =>
  new Date(date).toLocaleString("en-GB", {
    timeZone: "Africa/Lagos",
    dateStyle: "medium",
    timeStyle: "short",
  });

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
    | "AUDIENCE_RESTRICTED"
    | "SESSION_NOT_FOUND"
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
        session_id,
        start_date,
        end_date,
        title,
        description,
        category,
        capacity,
        duration,
        audience_scope = "all",
        audience_rules = [],
      } = payload;

      const organiserProfile = await db.EventOrganiserProfile.findOne({
        where: { user_id: userId },
      });

      const organisation_id = organiserProfile?.organisation_id ?? null;
      const session = session_id
        ? await db.AcademicSession.findByPk(Number(session_id))
        : await db.AcademicSession.findOne({ where: { is_active: true } });

      if (session_id && !session) return { ok: false, reason: "SESSION_NOT_FOUND" };

      const resolvedSessionId = session?.id ?? null;

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

      const newEvent = await db.sequelize.transaction(async (transaction: any) => {
        // Explicitly define database columns instead of spreading generic payload objects
        const event = await db.Event.create({
          title,
          description,
          category,
          capacity,
          thumbnail: thumbnailUrl,
          duration,
          venue_id,
          session_id: resolvedSessionId,
          start_date: startTimestamp,
          end_date: endTimestamp,
          organisation_id,
          created_by: userId,
          status: "pending",
          audience_scope,
        }, { transaction });

        await EventAudienceService.replaceRules(
          event.id,
          audience_scope,
          audience_rules,
          { transaction },
        );

        return event;
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
    userRole?: string,
  ): Promise<EventResult> {
    try {
      const event = await db.Event.findByPk(eventId);
      if (!event) return { ok: false, reason: "EVENT_NOT_FOUND" };

      if (event.created_by !== userId && userRole !== "super-admin") {
        return { ok: false, reason: "UNAUTHORIZED" };
      }

      const newVenueId = payload.venue_id || event.venue_id;
      if (payload.session_id) {
        const session = await db.AcademicSession.findByPk(Number(payload.session_id));
        if (!session) return { ok: false, reason: "SESSION_NOT_FOUND" };
      }

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

      // Snapshot the fields attendees rely on before they're overwritten, so
      // we can tell after the update whether anything sensitive actually changed.
      const previousVenueId = event.venue_id;
      const previousStart = new Date(event.start_date).getTime();
      const previousEnd = new Date(event.end_date).getTime();

      const {
        audience_rules,
        audience_scope,
        ...eventPayload
      } = payload;

      if (eventPayload.thumbnail) {
        const thumbnailUrl = await CloudinaryHelper.uploadSingle(
          eventPayload.thumbnail,
        );
        eventPayload.thumbnail = thumbnailUrl;
      }

      if (audience_scope) {
        eventPayload.audience_scope = audience_scope;
      }

      const updatedEvent = await db.sequelize.transaction(async (transaction: any) => {
        const nextEvent = await event.update(eventPayload, { transaction });

        if (audience_scope || Array.isArray(audience_rules)) {
          await EventAudienceService.replaceRules(
            event.id,
            audience_scope ?? event.audience_scope,
            audience_rules ?? [],
            { transaction },
          );
        }

        return nextEvent;
      });

      // Enrolled users depend on venue and schedule to actually show up, so
      // notify them by email whenever either changes. Thumbnail, title,
      // description, capacity, etc. don't warrant an email.
      const venueChanged =
        Number(updatedEvent.venue_id) !== Number(previousVenueId);
      const timeChanged =
        new Date(updatedEvent.start_date).getTime() !== previousStart ||
        new Date(updatedEvent.end_date).getTime() !== previousEnd;

      if (venueChanged || timeChanged) {
        void EventService.notifyEnrolledUsersOfUpdate(updatedEvent, {
          venueChanged,
          timeChanged,
        });
      }

      return { ok: true, data: updatedEvent };
    } catch (error) {
      console.error("UPDATE_EVENT_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Emails actively-enrolled users (skips cancelled enrollments) when an
   * event's venue or schedule changes. Failures here are logged but never
   * bubble up — a notification problem shouldn't fail the update request.
   */
  static async notifyEnrolledUsersOfUpdate(
    event: any,
    flags: { venueChanged: boolean; timeChanged: boolean },
  ): Promise<void> {
    try {
      const venue = await db.Venue.findByPk(event.venue_id);
      const eventDate = formatEventDateTime(event.start_date);

      const changes: string[] = [];
      if (flags.timeChanged) {
        changes.push(`<strong>Date &amp; time</strong> changed to ${eventDate}`);
      }
      if (flags.venueChanged) {
        changes.push(
          `<strong>Venue</strong> changed to ${venue?.name ?? "a new venue"}`,
        );
      }

      const enrollments = await db.EventEnrollment.findAll({
        where: { event_id: event.id, status: { [Op.ne]: "cancelled" } },
      });

      for (const enrollment of enrollments) {
        const user = await db.User.findByPk(enrollment.user_id);
        if (!user?.email) continue;

        const payload = {
          to: user.email,
          firstName: user.first_name ?? "",
          eventTitle: String(event.title),
          eventDate,
          venue: venue?.name ?? "",
          changes,
        };

        if (qrQueue && typeof qrQueue.add === "function") {
          await qrQueue.add(
            { jobType: "update", payload },
            { attempts: 3, backoff: 5000 },
          );
        } else {
          void sendEventUpdateEmail(payload);
        }
      }
    } catch (notifyErr) {
      console.error("UPDATE_EVENT_NOTIFY_ERROR:", notifyErr);
    }
  }

  /**
   * Evaluates records with unified search parameters and fallback query filters.
   * Includes itemized dynamically calculated active enrollment fill percentages.
   */
  static async getAllEvents(
    filters: any = {},
    pagination: any = {},
    userId?: number,
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
      if (filters.venue_id) where.venue_id = filters.venue_id;
      if (filters.session_id) where.session_id = Number(filters.session_id);
      if (filters.created_by || filters.creator_by) {
        where.created_by = Number(filters.created_by || filters.creator_by);
      }

      if (filters.date) {
        where.start_date = new Date(filters.date);
      } else if (filters.start_date_from || filters.start_date_to) {
        where.start_date = {};
        if (filters.start_date_from)
          where.start_date[Op.gte] = new Date(filters.start_date_from);
        if (filters.start_date_to)
          where.start_date[Op.lte] = new Date(filters.start_date_to);
      }

      if (filters.title) {
        where.title = filters.title;
      } else if (filters.search) {
        where.title = { [Op.iLike]: `%${filters.search}%` };
      }

      const audienceProfile = userId
        ? await EventAudienceService.getUserAudienceProfile(userId)
        : null;

      if (
        audienceProfile &&
        !EventAudienceService.canManageAllEvents(audienceProfile) &&
        ["staff", "student"].includes(audienceProfile.role)
      ) {
        // Students/staff should never see events that have already ended —
        // registering for something that's already over makes no sense.
        // Admins/organisers still see past events for reporting/management.
        where.end_date = { [Op.gte]: new Date() };

        const profileFilters: any[] = [
          { "$audienceRules.role$": audienceProfile.role },
          {
            [Op.or]: [
              { "$audienceRules.gender$": null },
              { "$audienceRules.gender$": audienceProfile.gender },
            ],
          },
        ];

        if (audienceProfile.role === "staff") {
          profileFilters.push({
            [Op.or]: [
              { "$audienceRules.staff_type$": null },
              { "$audienceRules.staff_type$": audienceProfile.staff_type },
            ],
          });
        }

        if (audienceProfile.role === "student") {
          profileFilters.push({
            [Op.or]: [
              { "$audienceRules.level_id$": null },
              { "$audienceRules.level_id$": audienceProfile.level_id },
            ],
          });
        }

        where[Op.and] = [
          ...(Array.isArray(where[Op.and]) ? where[Op.and] : []),
          {
            [Op.or]: [
              { audience_scope: "all" },
              { [Op.and]: profileFilters },
            ],
          },
        ];
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
              "fillPercentage",
            ],
          ],
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
          },
          {
            model: db.AcademicSession,
            as: "session",
            attributes: ["id", "name", "code", "is_active"],
          },
          {
            model: db.EventAudienceRule,
            as: "audienceRules",
            required: false,
            include: [
              {
                model: db.Level,
                as: "level",
                attributes: ["id", "name", "code"],
              },
            ],
          },
        ],
        order: [["start_date", "ASC"]],
        limit,
        offset,
        distinct: true,
        subQuery: false,
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
  static async getEventById(eventId: number, userId?: number): Promise<EventResult> {
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
              "fillPercentage",
            ],
          ],
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
          },
          {
            model: db.AcademicSession,
            as: "session",
            attributes: ["id", "name", "code", "is_active"],
          },
          {
            model: db.EventAudienceRule,
            as: "audienceRules",
            required: false,
            include: [
              {
                model: db.Level,
                as: "level",
                attributes: ["id", "name", "code"],
              },
            ],
          },
        ],
      });
      if (!event) return { ok: false, reason: "EVENT_NOT_FOUND" };

      if (userId) {
        const profile = await EventAudienceService.getUserAudienceProfile(userId);
        if (!EventAudienceService.eventMatchesProfile(event, profile)) {
          return { ok: false, reason: "AUDIENCE_RESTRICTED" };
        }
      }

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
   * Cancels an event (soft delete)
   */
  static async cancelEvent(
    eventId: number,
    userId: number,
    userRole?: string,
  ): Promise<EventResult> {
    try {
      const event = await db.Event.findByPk(eventId);
      if (!event) return { ok: false, reason: "EVENT_NOT_FOUND" };

      // Only event creator or admin can cancel
      if (event.created_by !== userId && userRole !== "super-admin")
        return { ok: false, reason: "UNAUTHORIZED" };

      await event.update({ status: "cancelled" });

      // Notify enrolled users (enqueue cancellation emails)
      try {
        const enrollments = await db.EventEnrollment.findAll({
          where: { event_id: eventId },
        });
        for (const enrollment of enrollments) {
          const user = await db.User.findByPk(enrollment.user_id);
          if (!user) continue;

          const payload = {
            to: user.email ?? "no-reply",
            firstName: user.first_name ?? "",
            eventTitle: String(event.title),
            eventDate: String(event.start_date),
            venue: "",
            reason: "Event cancelled by organiser",
          };

          if (qrQueue && typeof qrQueue.add === "function") {
            await qrQueue.add(
              { jobType: "cancellation", payload },
              { attempts: 3, backoff: 5000 },
            );
          } else {
            void sendEventCancellationEmail(payload);
          }
        }
      } catch (notifyErr) {
        console.error("CANCEL_EVENT_NOTIFY_ERROR:", notifyErr);
      }

      return {
        ok: true,
        data: { message: "Event cancelled successfully", event },
      };
    } catch (error) {
      console.error("CANCEL_EVENT_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Deletes an event (soft delete by marking as rejected)
   * or hard delete if no enrollments
   */
  static async deleteEvent(
    eventId: number,
    userId: number,
    userRole?: string,
  ): Promise<EventResult> {
    try {
      const event = await db.Event.findByPk(eventId);
      if (!event) return { ok: false, reason: "EVENT_NOT_FOUND" };

      // Only event creator or admin can delete
      if (event.created_by !== userId && userRole !== "super-admin")
        return { ok: false, reason: "UNAUTHORIZED" };

      // Check if event has enrollments
      const enrollmentCount = await db.EventEnrollment.count({
        where: { event_id: eventId },
      });

      if (enrollmentCount > 0) {
        await event.update({ status: "cancelled" });
        return {
          ok: true,
          data: { message: "Event cancelled. Enrollments preserved.", event },
        };
      } else {
        // Hard delete if no enrollments
        await event.destroy();
        return { ok: true, data: { message: "Event permanently deleted." } };
      }
    } catch (error) {
      console.error("DELETE_EVENT_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Get event statistics for organizer/admin dashboard
   */
  static async getEventStats(userId?: number): Promise<EventResult> {
    try {
      const baseWhere: any = userId ? { created_by: userId } : {};
      const now = new Date();
      const activeStatuses = ["pending", "approved"];

      const [
        totalEvents,
        pendingApproval,
        approvedEvents,
        rejectedEvents,
        cancelledEvents,
        upcomingEvents,
        activeEvents,
        pastEvents,
        totalRegistrations,
        attendedRegistrations,
      ] = await Promise.all([
        db.Event.count({ where: baseWhere }),
        db.Event.count({ where: { ...baseWhere, status: "pending" } }),
        db.Event.count({ where: { ...baseWhere, status: "approved" } }),
        db.Event.count({ where: { ...baseWhere, status: "rejected" } }),
        db.Event.count({ where: { ...baseWhere, status: "cancelled" } }),
        db.Event.count({
          where: {
            ...baseWhere,
            status: { [Op.in]: activeStatuses },
            start_date: { [Op.gt]: now },
          },
        }),
        db.Event.count({
          where: {
            ...baseWhere,
            status: "approved",
            start_date: { [Op.lte]: now },
            end_date: { [Op.gte]: now },
          },
        }),
        db.Event.count({
          where: {
            ...baseWhere,
            status: "approved",
            end_date: { [Op.lt]: now },
          },
        }),
        db.EventEnrollment.count({
          where: { status: { [Op.in]: ["confirmed", "attended"] } },
          include: userId
            ? [{ model: db.Event, as: "event", where: baseWhere }]
            : undefined,
        }),
        db.EventEnrollment.count({
          where: { status: "attended" },
          include: userId
            ? [{ model: db.Event, as: "event", where: baseWhere }]
            : undefined,
        }),
      ]);

      const stats = {
        total_events: totalEvents,
        pending_approval: pendingApproval,
        approved_events: approvedEvents,
        rejected_events: rejectedEvents,
        cancelled_events: cancelledEvents,
        upcoming_events: upcomingEvents,
        active_events: activeEvents,
        past_events: pastEvents,
        total_registrations: totalRegistrations,
        attended_registrations: attendedRegistrations,
      };

      return { ok: true, data: stats };
    } catch (error) {
      console.error("GET_EVENT_STATS_ERROR:", error);
      throw error;
    }
  }
}