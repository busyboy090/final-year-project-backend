import type { Request, Response } from "express";
import { EnrollmentService } from "../../services/event/enrollment.service.ts";

export class EnrollmentController {
  static async join(req: Request, res: Response) {
    try {
      const { eventId } = req.body;
      const userId = Number(req.user?.userId); // Extracted from Auth Middleware

      const result = await EnrollmentService.enrollInEvent(eventId, userId);

      if (result.ok) {
        return res.status(201).json({
          success: true,
          message: "You have successfully registered for the event.",
          data: result.data
        });
      }

      // Return precise error reasons
      switch (result.reason) {
        case "ALREADY_ENROLLED":
          return res.status(409).json({ success: false, message: "You are already registered for this event." });
        case "EVENT_FULL":
          return res.status(403).json({ success: false, message: "Event capacity reached." });
        case "EVENT_NOT_APPROVED":
          return res.status(403).json({ success: false, message: "This event is not open for registration." });
        default:
          return res.status(400).json({ success: false, message: "Registration failed." });
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  static async getMyEvents(req: Request, res: Response) {
    try {
      const userId = Number(req.user?.userId);
      const data = await EnrollmentService.getMyEnrollments(userId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
}