import type { Request, Response } from "express";
import { EventService } from "../../services/event/create.service.ts";

export class EventController {
  /**
   * Normalizes layout items, extracts duration, and generates a new event record
   */
  static async create(req: Request, res: Response) {
    try {
      const userId = Number(req.user?.userId);
      const form = req.body;

      // 1. Unify discrete date and time strings into proper JavaScript Date instances
      const start = new Date(`${form.startDate}T${form.startTime}:00`);
      const end = new Date(`${form.endDate}T${form.endTime}:00`);

      // 2. Extract event runtime duration dynamically in minutes
      let durationInMinutes = 0;
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        durationInMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
      }

      // 3. Construct clean data structure to match database schemas
      const backendPayload = {
        title: form.title,
        category: form.category,
        description: form.description,
        venue_id: Number(form.venue_id),
        capacity: Number(form.capacity),
        start_date: start,
        end_date: end,
        duration: durationInMinutes,
      };

      // 4. Delegate to backend event engine service
      const result = await EventService.createEvent(backendPayload, userId);
      
      if (result.ok) {
        return res.status(201).json({ success: true, data: result.data });
      }

      // 5. Map internal failures to clean RESTful status codes
      const errorMap: Record<string, number> = { 
        VENUE_NOT_FOUND: 404, 
        VENUE_UNAVAILABLE: 409, 
        INVALID_DATE_RANGE: 400 
      };
      
      return res
        .status(errorMap[result.reason!] || 400)
        .json({ success: false, message: result.reason });

    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ success: false, errors: error.errors.map((e: any) => e.message) });
      }
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  /**
   * Updates existing parameters
   */
  static async update(req: Request, res: Response) {
    try {
      const userId = Number(req.user?.userId);
      const form = req.body;

      const backendPayload: any = {
        title: form.eventTitle,
        category: form.category,
        description: form.description,
        venue_id: form.selectedVenue ? Number(form.selectedVenue) : undefined,
        capacity: form.capacity ? Number(form.capacity) : undefined,
      };

      if (form.startDate && form.startTime) backendPayload.start_date = new Date(`${form.startDate}T${form.startTime}:00`);
      if (form.endDate && form.endTime) backendPayload.end_date = new Date(`${form.endDate}T${form.endTime}:00`);

      const result = await EventService.updateEvent(Number(req.params.id), backendPayload, userId);
      if (result.ok) return res.status(200).json({ success: true, message: "Event updated", data: result.data });

      const errorMap: Record<string, number> = { EVENT_NOT_FOUND: 404, UNAUTHORIZED: 403, VENUE_UNAVAILABLE: 409, INVALID_DATE_RANGE: 400 };
      return res.status(errorMap[result.reason!] || 400).json({ success: false, message: result.reason });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  /**
   * Lists records matching provided filters
   */
  static async list(req: Request, res: Response) {
    try {
      const { page, limit, ...filters } = req.query;
      const result = await EventService.getAllEvents(filters, { page, limit });
      return res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  /**
   * Administrative Workflow updates
   */
  static async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      const result = await EventService.updateEventStatus(Number(req.params.id), status);

      if (result.ok) return res.status(200).json({ success: true, message: `Status configured to ${status}`, data: result.data });
      return res.status(result.reason === "EVENT_NOT_FOUND" ? 404 : 400).json({ success: false, message: result.reason });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  /**
   * Immediate Event Cancellation
   */
  static async cancel(req: Request, res: Response) {
    try {
      const userId = Number(req.user?.userId);
      const result = await EventService.cancelEvent(Number(req.params.id), userId);

      if (result.ok) return res.status(200).json({ success: true, message: "Event successfully cancelled", data: result.data });
      return res.status(result.reason === "EVENT_NOT_FOUND" ? 404 : 403).json({ success: false, message: result.reason });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
}