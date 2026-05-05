import type { Request, Response } from "express";
import { LevelService } from "../services/level.service.ts";

export class LevelController {
  /**
   * GET /api/v1/levels
   */
  static async getAllLevels(_req: Request, res: Response) {
    try {
      const levels = await LevelService.getAllLevels();
      return res.status(200).json({
        success: true,
        count: levels.length,
        data: levels
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  /**
   * POST /api/v1/levels
   */
  static async createLevel(req: Request, res: Response) {
    try {
      const result = await LevelService.createLevel(req.body);

      if (result.ok) {
        return res.status(201).json({
          success: true,
          message: "Academic level created successfully.",
          data: result.data
        });
      }

      if (result.reason === "LEVEL_ALREADY_EXISTS") {
        return res.status(409).json({
          success: false,
          message: "An academic level with this name or code already exists.",
          reason: result.reason
        });
      }

      return res.status(400).json({ success: false, message: "Failed to create level." });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
}