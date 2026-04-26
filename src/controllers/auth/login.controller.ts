import type { Request, Response } from "express";
import { loginUser } from "../../services/auth/login.service.ts";
import config from "../../configs/env.ts";

export const loginController = async (req: Request, res: Response) => {
  try {
    const result = await loginUser(req.body);

    if (!result.ok) {
      switch (result.reason) {
        case "INVALID_CREDENTIALS":
          return res.status(401).json({
            success: false,
            message: "Invalid email or password",
          });

        case "INACTIVE_ACCOUNT":
          return res.status(403).json({
            success: false,
            message: "Your account is inactive. Please contact support.",
          });

        case "EMAIL_NOT_VERIFIED":
          res.cookie("tempToken", result.tempToken, {
            httpOnly: true,
            signed: true,
            secure: config.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000, // 15 minutes 
          });

          return res.status(403).json({
            success: false,
            message: "Email not verified. A new 6-digit code has been sent to your inbox.",
            requireEmailVerification: true
          });

        case "VERIFICATION_EMAIL_SEND_FAILED":
          return res.status(500).json({
            success: false,
            message: "Email not verified, but we couldn't send the verification email. Please try again later.",
          });

        case "MFA_OTP_EMAIL_SEND_FAILED":
          return res.status(500).json({
            success: false,
            message: "We couldn't send the OTP. Please try again later.",
          });

        case "MFA_REQUIRED":
          // Set Temp token for indetification
          res.cookie("tempToken", result.tempToken, {
            httpOnly: true,
            signed: true,
            secure: config.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000, // 15 minutes 
          });
          
          return res.status(200).json({
            success: true,
            mfaRequired: true,
            message: "Please enter your 2FA token",
          });

        default:
          return res.status(400).json({
            success: false,
            message: "Login failed",
          });
      }
    }

    // --- Success Case ---

    // Set the Refresh Token in an HTTP-only cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      signed: true,
      secure: config.NODE_ENV === "production", // Only send over HTTPS in production
      sameSite: "strict", // Prevents CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (match your JWT expiry)
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    console.error("Login Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal error occurred during login",
    });
  }
};