import type { Request, Response } from "express";
import { loginUser } from "../../services/auth/login.service.ts";
import config from "../../configs/env.ts";

export const loginController = async (req: Request, res: Response) => {
  try {
    const result = await loginUser(req.body);

    if (!result.ok) {
      switch (result.reason) {
        case "INVALID_CREDENTIALS":
          return res.status(401).json({ success: false, message: "Invalid email or password" });

        case "INACTIVE_ACCOUNT":
          return res.status(403).json({ success: false, message: "Account inactive. Contact support." });

        case "EMAIL_NOT_VERIFIED":
          // Set tempToken so the user can verify their email without re-entering password
          res.cookie("tempToken", result.tempToken, {
            httpOnly: true,
            signed: true,
            secure: config.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000,
          });

          return res.status(403).json({
            success: false,
            message: "Email not verified. Check your inbox for a code.",
            requireEmailVerification: true
          });

        case "MFA_REQUIRED":
          res.cookie("tempToken", result.tempToken, {
            httpOnly: true,
            signed: true,
            secure: config.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000,
          });

          return res.status(200).json({
            success: true,
            mfaRequired: true,
            message: "Please enter your 2FA token",
          });

        // ... handle other cases
      }
    }

    // --- Standard Success Case (No MFA/Verification needed) ---
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      signed: true,
      secure: config.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};