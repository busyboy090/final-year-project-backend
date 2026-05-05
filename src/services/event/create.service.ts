import db from "../../models/index.ts";
import { VenueService } from "../venue.service.ts";
import type { EventInput  ,UpdateEventInput } from "../../validators/event/create.schema.ts";

type EventResult = {
  ok: boolean;
  data?: any;
  reason?: "VENUE_UNAVAILABLE" | "VENUE_NOT_FOUND" | "EVENT_NOT_FOUND" | "INVALID_DATE_RANGE" | "UNAUTHORIZED";
};

export class EventService {
  /**
   * Creates a new event application after checking venue availability
   */
  static async createEvent(payload: EventInput['body'], userId: number): Promise<EventResult> {
    try {
      const { venue: venueId, start_date, end_date } = payload;

      if (new Date(start_date) >= new Date(end_date)) {
        return { ok: false, reason: "INVALID_DATE_RANGE" };
      }

      const venue = await db.Venue.findByPk(venueId);
      if (!venue) return { ok: false, reason: "VENUE_NOT_FOUND" };

      const isAvailable = await VenueService.isVenueAvailable(
        venueId, 
        new Date(start_date), 
        new Date(end_date)
      );

      if (!isAvailable) return { ok: false, reason: "VENUE_UNAVAILABLE" };

      const newEvent = await db.Event.create({
        ...payload,
        created_by: userId,
        status: 'pending'
      });

      return { ok: true, data: newEvent };
    } catch (error) {
      console.error("CREATE_EVENT_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Updates an existing event and re-validates schedule if venue/time changes
   */
  static async updateEvent(eventId: number, payload: Partial<UpdateEventInput['body']>, userId: number): Promise<EventResult> {
    try {
      const event = await db.Event.findByPk(eventId);
      if (!event) return { ok: false, reason: "EVENT_NOT_FOUND" };

      // Authorization: Only creator can edit (Admin overrides handled in controller)
      if (event.created_by !== userId) return { ok: false, reason: "UNAUTHORIZED" };

      const newVenueId = payload.venue || event.venue;
      const newStart = payload.start_date ? new Date(payload.start_date) : new Date(event.start_date);
      const newEnd = payload.end_date ? new Date(payload.end_date) : new Date(event.end_date);

      // Re-validate if schedule-critical fields change
      if (payload.start_date || payload.end_date || payload.venue) {
        if (newStart >= newEnd) return { ok: false, reason: "INVALID_DATE_RANGE" };

        const isAvailable = await VenueService.isVenueAvailable(
          newVenueId,
          newStart,
          newEnd
        );

        // Note: isVenueAvailable should be updated to ignore current eventId during check
        if (!isAvailable) return { ok: false, reason: "VENUE_UNAVAILABLE" };
      }

      const updatedEvent = await event.update(payload);
      return { ok: true, data: updatedEvent };
    } catch (error) {
      console.error("UPDATE_EVENT_SERVICE_ERROR:", error);
      throw error;
    }
  }

  static async getAllEvents(filters: any = {}): Promise<EventResult> {
    try {
      const events = await db.Event.findAll({
        where: filters,
        include: [
          { model: db.User, as: 'creator', attributes: ['first_name', 'last_name', 'email'] },
          { model: db.Venue, as: 'eventVenue', attributes: ['name', 'location'] }
        ],
        order: [['start_date', 'ASC']]
      });
      return { ok: true, data: events };
    } catch (error) {
      console.error("GET_EVENTS_SERVICE_ERROR:", error);
      throw error;
    }
  }

  static async updateEventStatus(eventId: number, status: 'approved' | 'rejected'): Promise<EventResult> {
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
}