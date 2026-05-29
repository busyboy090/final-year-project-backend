import type { Request, Response } from "express";
import { ProfileService } from "../../services/user/profile.service.ts";
import type { UserRole } from "../../types/user.d.ts";

export class ProfileController {
  /**
   * GET /api/v1/profile
   * Fetches the flattened profile for the authenticated user's role.
   */
  static async getMyProfile(req: Request, res: Response) {
    try {
      const userId = Number(req.user?.userId);
      const role   = req.user?.role as UserRole;

      if (!role) {
        return res.status(400).json({
          success: false,
          message: "No role identified for profile fetching",
        });
      }

      const profile = await ProfileService.getFlattenedUserProfile(userId, role);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: `Profile not found`,
        });
      }

      return res.status(200).json({ success: true, data: profile });
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
   */
  static async completeStudentProfile(req: Request, res: Response) {
    try {
      const userId       = Number(req.user?.userId);
      const updatedProfile = await ProfileService.updateStudentProfile(userId, req.body);

      return res.status(200).json({
        success: true,
        message: "Student profile updated successfully",
        data:    updatedProfile,
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
   * PUT /api/v1/profile/staff/complete
   */
  static async completeStaffProfile(req: Request, res: Response) {
    try {
      const userId         = Number(req.user?.userId);
      const updatedProfile = await ProfileService.updateStaffProfile(userId, req.body);

      return res.status(200).json({
        success: true,
        message: "Staff profile updated successfully",
        data:    updatedProfile,
      });
    } catch (error: any) {
      console.error("UPDATE_STAFF_PROFILE_ERROR:", error);
      return res.status(error.message === "User not found" ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to update staff profile",
      });
    }
  }

  static async updatePersonalInfo(req: Request, res: Response) {
    try {
      const userId = req.user?.userId; 

      const updatedProfile = await ProfileService.updatePersonalInfo(Number(userId), {...req.body});

      return res.status(200).json({
        message: "Profile updated successfully",
        user: updatedProfile,
      });

    } catch (error: any) {
      if (error.message === "User not found.") {
        return res.status(404).json({ message: error.message });
      }

      console.error("Update Profile Error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}