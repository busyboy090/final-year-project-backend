import type { Request, Response } from "express";
import { generateAccessToken, verifyRefreshToken } from "../../utils/jwt.ts";
import db from "../../models/index.ts"

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
    // verifyRefreshToken will throw an error if the token is invalid or expired
    const decoded = verifyRefreshToken(refreshToken);

    // find user
    const user = await db.User.findByPk(Number(decoded.userId));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 3. Prepare the new payload 
    // We explicitly pick the fields we want to pass forward
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    // 4. Generate the new access token
    const newAccessToken = generateAccessToken(tokenPayload);

    // 5. Return success
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
        is_active: user.is_active
      }
    });

  } catch (error: any) {
    // If jwt.verify fails, it throws an error we catch here
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