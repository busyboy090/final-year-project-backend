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
        case "EVENT_ENDED":
          return res.status(403).json({ success: false, message: "This event has already ended and is no longer open for registration." });
        case "AUDIENCE_RESTRICTED":
          return res.status(403).json({ success: false, message: "This event is not available to your audience." });
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

  /**
   * Mark user as checked-in to an event
   */
  static async checkIn(req: Request, res: Response) {
    try {
      const enrollmentId = Number(req.params.enrollmentId);
      const userId = Number(req.user?.userId);
      
      const result = await EnrollmentService.checkInToEvent(enrollmentId, userId);

      if (result.ok) {
        return res.status(200).json({
          success: true,
          message: "Successfully checked in to event",
          data: result.data
        });
      }

      return res.status(404).json({ success: false, message: "Enrollment not found" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  /**
   * Cancel enrollment (unenroll from event)
   */
  static async cancelEnrollment(req: Request, res: Response) {
    try {
      const enrollmentId = Number(req.params.enrollmentId);
      const userId = Number(req.user?.userId);
      
      const result = await EnrollmentService.cancelEnrollment(enrollmentId, userId);

      if (result.ok) {
        return res.status(200).json({
          success: true,
          message: "Enrollment cancelled successfully",
          data: result.data
        });
      }

      return res.status(404).json({ success: false, message: "Enrollment not found" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  /**
   * Get attendance statistics for an event
   */
  static async getAttendanceStats(req: Request, res: Response) {
    try {
      const eventId = Number(req.params.eventId);
      
      const result = await EnrollmentService.getEventAttendanceStats(eventId);

      if (result.ok) {
        return res.status(200).json({
          success: true,
          data: result.data
        });
      }

      return res.status(404).json({ success: false, message: "Event not found" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  /**
   * Export registrants to CSV
   */
  static async exportRegistrantsCSV(req: Request, res: Response) {
    try {
      // Use req.params.id since it is registered in event.route.ts as /:id/registrants/export
      const eventId = Number(req.params.id);
      
      const result = await EnrollmentService.exportRegistrantsCSV(eventId);

      if (result.ok) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="event-${eventId}-registrants.csv"`);
        return res.status(200).send(result.data);
      }

      return res.status(404).json({ success: false, message: "Event not found" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
}