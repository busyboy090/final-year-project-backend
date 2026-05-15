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

  /**
   * PUT /api/v1/profile/event-organiser/complete
   */
  static async completeEventOrganiserProfile(req: Request, res: Response) {
    try {
      const userId         = Number(req.user?.userId);
      const updatedProfile = await ProfileService.updateEventOrganiserProfile(userId, req.body);

      return res.status(200).json({
        success: true,
        message: "Event organiser profile updated successfully",
        data:    updatedProfile,
      });
    } catch (error: any) {
      console.error("UPDATE_EVENT_ORGANISER_PROFILE_ERROR:", error);
      return res.status(error.message === "User not found" ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to update event organiser profile",
      });
    }
  }

  // /**
  //  * PUT /api/v1/profile/admin/complete
  //  */
  // static async completeAdminProfile(req: Request, res: Response) {
  //   try {
  //     const userId         = Number(req.user?.userId);
  //     const updatedProfile = await ProfileService.updateAdminProfile(userId, req.body);

  //     return res.status(200).json({
  //       success: true,
  //       message: "Admin profile updated successfully",
  //       data:    updatedProfile,
  //     });
  //   } catch (error: any) {
  //     console.error("UPDATE_ADMIN_PROFILE_ERROR:", error);
  //     return res.status(error.message === "User not found" ? 404 : 500).json({
  //       success: false,
  //       message: error.message || "Failed to update admin profile",
  //     });
  //   }
  // }

  /**
   * PATCH /api/v1/profile/avatar
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
        data:    result,
      });
    } catch (error: any) {
      console.error("UPDATE_AVATAR_ERROR:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to update avatar",
      });
    }
  }

  static async updatePersonalInfo(req: Request, res: Response) {
    try {
      // 1. Get the User ID from the auth middleware (e.g., JWT)
      // If this is for an admin updating someone else, use req.params.id
      const userId = req.user?.userId; 

      // 2. Extract specific fields to prevent "over-posting" (malicious extra data)
      const { first_name, last_name } = req.body;

      // 3. Call the service method we refactored
      const updatedProfile = await ProfileService.updatePersonalInfo(Number(userId), {
        first_name,
        last_name,
      });

      // 4. Return the flattened profile directly
      return res.status(200).json({
        message: "Profile updated successfully",
        user: updatedProfile,
      });

    } catch (error: any) {
      // 5. Error Handling
      if (error.message === "User not found.") {
        return res.status(404).json({ message: error.message });
      }

      console.error("Update Profile Error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}