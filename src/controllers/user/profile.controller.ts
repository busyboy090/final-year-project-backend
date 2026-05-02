import type { Request, Response } from "express";
import { ProfileService } from "../../services/user/profile.service.ts";

export class ProfileController {
  /**
   * Fetches the current logged-in user's flattened profile
   */
  static async getMyProfile(req: Request, res: Response) {
    try {
      const userId = Number(req.user?.userId);
      const role = req.user?.role as any;

      const profile = await ProfileService.getFlattenedUserProfile(userId, role);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Profile not found",
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
   * Updates student personal info and academic profile
   */
  static async completeStudentProfile(req: Request, res: Response) {
    try {
      const updatedProfile = await ProfileService.updateStudentProfile(Number(req.user?.userId), req.body);

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
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
   * Updates the profile picture URL in the User table
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