import type { Request, Response } from "express";
import { AcademicSessionService } from "../services/academic-session.service.ts";

const errorStatus: Record<string, number> = {
  SESSION_ALREADY_EXISTS: 409,
  SESSION_NOT_FOUND: 404,
  INVALID_DATE_RANGE: 400,
  SESSION_IN_USE: 409,
};

const messageFor = (reason?: string) => {
  switch (reason) {
    case "SESSION_ALREADY_EXISTS":
      return "An academic session with this name or code already exists.";
    case "SESSION_NOT_FOUND":
      return "Academic session not found.";
    case "INVALID_DATE_RANGE":
      return "Session end date must be after the start date.";
    case "SESSION_IN_USE":
      return "This academic session has events linked to it and cannot be deleted.";
    default:
      return "Academic session request failed.";
  }
};

export class AcademicSessionController {
  static async getAllSessions(_req: Request, res: Response) {
    try {
      const sessions = await AcademicSessionService.getAllSessions();
      return res.status(200).json({
        success: true,
        count: sessions.length,
        data: sessions,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  static async getCurrentSession(_req: Request, res: Response) {
    try {
      const session = await AcademicSessionService.getCurrentSession();
      return res.status(200).json({
        success: true,
        data: session,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  static async createSession(req: Request, res: Response) {
    try {
      const result = await AcademicSessionService.createSession(req.body);
      if (result.ok) {
        return res.status(201).json({
          success: true,
          message: "Academic session created successfully.",
          data: result.data,
        });
      }

      return res.status(errorStatus[result.reason!] || 400).json({
        success: false,
        message: messageFor(result.reason),
        reason: result.reason,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  static async updateSession(req: Request, res: Response) {
    try {
      const result = await AcademicSessionService.updateSession(
        Number(req.params.id),
        req.body,
      );

      if (result.ok) {
        return res.status(200).json({
          success: true,
          message: "Academic session updated successfully.",
          data: result.data,
        });
      }

      return res.status(errorStatus[result.reason!] || 400).json({
        success: false,
        message: messageFor(result.reason),
        reason: result.reason,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  static async setCurrentSession(req: Request, res: Response) {
    try {
      const result = await AcademicSessionService.setCurrentSession(Number(req.params.id));

      if (result.ok) {
        return res.status(200).json({
          success: true,
          message: "Current academic session updated successfully.",
          data: result.data,
        });
      }

      return res.status(errorStatus[result.reason!] || 400).json({
        success: false,
        message: messageFor(result.reason),
        reason: result.reason,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  static async deleteSession(req: Request, res: Response) {
    try {
      const result = await AcademicSessionService.deleteSession(Number(req.params.id));

      if (result.ok) {
        return res.status(200).json({
          success: true,
          message: result.data.message,
          data: result.data,
        });
      }

      return res.status(errorStatus[result.reason!] || 400).json({
        success: false,
        message: messageFor(result.reason),
        reason: result.reason,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
}
