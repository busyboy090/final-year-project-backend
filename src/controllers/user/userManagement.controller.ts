import type { Request, Response } from "express";
import { UserManagementService } from "../../services/user/userManagement.service.ts";

export class UserManagementController {
  static async list(req: Request, res: Response) {
    try {
      const { page, limit, search, role, department_id } = req.query as unknown as {
        page: number;
        limit: number;
        search?: string;
        role?: string;
        department_id?: number;
      };

      const result = await UserManagementService.list({
        page,
        limit,
        search,
        role,
        department_id,
      });

      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      console.error("USER_MANAGEMENT_LIST:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to load users",
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const targetId = Number(req.params.id);
      const actorId = Number(req.user?.userId);

      const updated = await UserManagementService.updateUser(targetId, actorId, req.body);

      return res.status(200).json({
        success: true,
        message: "User updated",
        data: updated,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "";

      if (msg === "NOT_FOUND") {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      if (msg === "EMAIL_TAKEN") {
        return res.status(409).json({ success: false, message: "That email is already in use" });
      }
      if (msg === "SELF_DEACTIVATE") {
        return res.status(400).json({
          success: false,
          message: "You cannot deactivate your own account from here",
        });
      }

      console.error("USER_MANAGEMENT_UPDATE:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update user",
      });
    }
  }
}
