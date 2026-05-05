import type { Request, Response } from "express";
import { EventService } from "../../services/event/create.service.ts";

export class EventController {
  static async create(req: Request, res: Response) {
    try {
      const userId = Number(req.user?.userId);
      
      const result = await EventService.createEvent(req.body, userId);

      if (result.ok) {
        return res.status(201).json({ success: true, data: result.data });
      }

      return res.status(400).json({ success: false, message: result.reason });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ success: false, errors: error.errors.map((e: any) => e.message) });
      }
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  static async update(req: Request, res: Response) {
    try {

      const userId = Number(req.user?.userId);
      const result = await EventService.updateEvent(Number(req.params.id), req.body, userId);

      if (result.ok) {
        return res.status(200).json({ success: true, message: "Event updated", data: result.data });
      }

      const errorMap: Record<string, number> = {
        EVENT_NOT_FOUND: 404,
        UNAUTHORIZED: 403,
        VENUE_UNAVAILABLE: 409,
        INVALID_DATE_RANGE: 400
      };

      return res.status(errorMap[result.reason!] || 400).json({ success: false, message: result.reason });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ success: false, errors: error.errors.map((e: any) => e.message) });
      }
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  static async list(req: Request, res: Response) {
    const result = await EventService.getAllEvents(req.query);
    return res.status(200).json({ success: true, data: result.data });
  }
}