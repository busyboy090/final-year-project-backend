import type { Request, Response } from "express";
import db from "../../models/index.ts";
import { OTPService } from "../../services/auth/otp.service.ts";

export const emailVerificationController = async (req: Request, res: Response) => {
  try {
    const { otp } = req.body;

    // Find User
    const user = await db.User.findByPk(Number(req.user?.userId));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify OTP via Redis Service
    const isValid = await OTPService.verifyOTP(user.email, "email_verification", otp);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    // Check if already verified (optional but good for UX)
    if (user.email_verified) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified",
      });
    }

    // Update User Record
    user.email_verified = true;
    await user.save();

    // clear temp token
    res.clearCookie("tempToken");

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });

  } catch (error) {
    console.error("Email Verification Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal error occurred during verification",
    });
  } 
};