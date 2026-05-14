import type { Request, Response } from "express";
import { UserManagementService } from "../../services/user/userManagement.service.ts";

export class UserManagementController {
  /**
   * Create a new user with assigned roles
   * Super admin only endpoint
   */
  static async createUser(req: Request, res: Response) {
    try {
      const { first_name, last_name, email, role, department_id } =
        req.body;

      const result = await UserManagementService.createUser({
        first_name,
        last_name,
        email,
        role,
        department_id,
      });

      if (!result.ok) {
        const statusCode = {
          EMAIL_EXISTS: 409,
          INVALID_ROLE: 400,
          NO_ROLES: 400,
          INVALID_INPUT: 400,
          SERVER_ERROR: 500,
        }[result.reason || "SERVER_ERROR"];

        return res.status(statusCode || 400).json({
          success: false,
          message: result.message || result.reason,
          reason: result.reason,
        });
      }

      // Success response
      const httpStatus = result.reason === "EMAIL_SEND_FAILED" ? 201 : 201;

      return res.status(httpStatus).json({
        success: true,
        message: result.message,
        data: result.user,
        warning:
          result.reason === "EMAIL_SEND_FAILED"
            ? "Email could not be sent"
            : undefined,
      });
    } catch (error: any) {
      console.error("ADMIN_CREATE_USER_ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create user",
        error: error?.message,
      });
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const { page, limit, search, role, department_id } =
        req.query as unknown as {
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

      const updated = await UserManagementService.updateUser(
        targetId,
        actorId,
        req.body,
      );

      return res.status(200).json({
        success: true,
        message: "User updated",
        data: updated,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "";

      if (msg === "NOT_FOUND") {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      if (msg === "EMAIL_TAKEN") {
        return res
          .status(409)
          .json({ success: false, message: "That email is already in use" });
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

  /**
     * Set password using the token from email
     * This is a public endpoint (no auth required) but validates token
     */
    static async setPassword(req: Request, res: Response) {
      try {
        const { password } = req.body;

  
        const result = await UserManagementService.setPassword(
          Number(req.user?.userId),
          password
        );
  
        if (!result.ok) {
          const statusCode = {
            INVALID_TOKEN: 401,
            TOKEN_MISMATCH: 403,
            USER_NOT_FOUND: 404,
            WEAK_PASSWORD: 400,
            SERVER_ERROR: 500,
          }[result.reason || "SERVER_ERROR"];
  
          return res.status(statusCode || 400).json({
            success: false,
            message: result.message,
            reason: result.reason,
          });
        }
  
        return res.status(200).json({
          success: true,
          message: result.message,
        });
      } catch (error: any) {
        console.error("SET_PASSWORD_ERROR:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to set password",
          error: error?.message,
        });
      }
    }
}
