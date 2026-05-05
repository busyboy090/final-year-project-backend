import type { Request, Response } from "express";
import { ProfileService } from "../../services/user/profile.service.ts";
import type { UserRole } from "../../types/user.d.ts";

export class ProfileController {
  /**
   * 
   * Fetches the flattened profile based on a specific role or the primary role.
   */
  static async getMyProfile(req: Request, res: Response) {
    try {
      const userId = Number(req.user?.userId);
      
      /**
       * 1. Multi-role handling: 
       * We take the role from the URL parameter if provided (e.g., /profile/staff),
       * otherwise, we default to the first role in the user's roles array.
       */
      const requestedRole = req.params.role as UserRole;
      const userRoles = req.user?.roles || [];
      
      const roleToFetch = requestedRole || userRoles[0];

      if (!roleToFetch) {
        return res.status(400).json({
          success: false,
          message: "No valid role identified for profile fetching",
        });
      }

      const profile = await ProfileService.getFlattenedUserProfile(userId, roleToFetch);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: `Profile data for role '${roleToFetch}' not found`,
        });
      }

      return res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      console.error("GET_PROFILE_ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "An internal error occurred while fetching profile",
      });
    }
  }

  /**
   * PUT /api/v1/profile/student/complete
   * Updates student personal info and academic profile.
   */
  static async completeStudentProfile(req: Request, res: Response) {
    try {
      const userId = Number(req.user?.userId);
      
      // Atomic update for User names and StudentProfile table
      const updatedProfile = await ProfileService.updateStudentProfile(userId, req.body);

      return res.status(200).json({
        success: true,
        message: "Student profile updated successfully",
        data: updatedProfile,
      });
    } catch (error: any) {
      console.error("UPDATE_STUDENT_PROFILE_ERROR:", error);
      return res.status(error.message === "User not found" ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to update student profile",
      });
    }
  }

  /**
   * PATCH /api/v1/profile/avatar
   * Centralized update for the profile picture URL.
   */
  static async updateAvatar(req: Request, res: Response) {
    try {
      const userId = Number(req.user?.userId);
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          message: "Avatar URL is required",
        });
      }

      const result = await ProfileService.updateAvatar(userId, url);

      return res.status(200).json({
        success: true,
        message: "Profile picture updated successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("UPDATE_AVATAR_ERROR:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to update avatar",
      });
    }
  }
}