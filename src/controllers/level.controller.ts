import type { Request, Response } from "express";
import db from "../models/index.ts";

export class LevelController {
  /**
   * Fetches levels based on the 'undergrade' category.
   * This will return only 100 to 500/600 levels.
   */
  static async getUndergradLevels(_req: Request, res: Response) {
    try {
      const levels = await db.Level.findAll({
        where: {
          category: "undergrade" // Matches your model's ENUM exactly
        },
        attributes: ["id", "name"],
        order: [["name", "ASC"]], 
      });

      return res.status(200).json(levels);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch undergraduate levels",
        error: error.message,
      });
    }
  }

  /**
   * Fetches levels for the 'postgrade' category (Grad levels).
   */
  static async getPostgradLevels(_req: Request, res: Response) {
    try {
      const levels = await db.Level.findAll({
        where: {
          category: "postgrade"
        },
        attributes: ["id", "name"],
        order: [["name", "ASC"]],
      });

      return res.status(200).json(levels);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch postgraduate levels",
        error: error.message,
      });
    }
  }

  /**
   * General fetch that allows the frontend to specify via query param
   * e.g., GET /api/levels?type=undergrade
   */
  static async getLevels(req: Request, res: Response) {
    try {
      const { type } = req.query;

      const levels = await db.Level.findAll({
        where: type ? { category: type } : {},
        attributes: ["id", "name", "category"],
        order: [["name", "ASC"]],
      });

      return res.status(200).json(levels);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error fetching levels",
        error: error.message,
      });
    }
  }
}