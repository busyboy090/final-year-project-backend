import type { Request, Response } from "express";
import { generateAccessToken, verifyRefreshToken } from "../../utils/jwt.ts";
import db from "../../models/index.ts";
import { ProfileService } from "../../services/user/profile.service.ts";

export const generateNewAccessToken = async (req: Request, res: Response) => {
  try {
    // 1. Extract the refresh token from the HTTP-only cookie
    const refreshToken = req.signedCookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    // 2. Verify the token using your utility
    const decoded = verifyRefreshToken(refreshToken);

    // 3. Find user
    const user = await db.User.findByPk(Number(decoded.userId));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }


    // 5. Check user profile
    const profileExist = await ProfileService.checkUserProfiles(user.id, user.role);

    // 6. Prepare the new payload with arrays for the JWT
    const tokenPayload = {
      userId: String(user.id),
      email: user.email,
      role: user.role,
    };

    // 7. Generate the new access token
    const newAccessToken = generateAccessToken(tokenPayload);

    // 8. Return success
    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified,
        is_active: user.is_active,
        two_factor_enabled: user.two_factor_enabled,
        profile_picture_url: user.profile_picture_url,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      ...(!profileExist && { needsProfileCompletion: true })
    });

  } catch (error: any) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired session. Please log in again.",
      });
    }

    console.error("Refresh Token Error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal error occurred.",
    });
  }
};