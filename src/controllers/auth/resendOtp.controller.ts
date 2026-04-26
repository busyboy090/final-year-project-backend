import { OTPService } from "../../services/auth/otp.service.ts";
import db from "../../models/index.ts";
import type { Request, Response } from "express";
import * as mailService from "../../services/mail/index.ts";

type OTPType = "mfa" | "email_verification" | "password_reset";

export const resendOtpController = (type: OTPType) => {
    return async (req: Request, res: Response) => {
      try {
        // 1. Find User (using req.user from your verifyTempToken middleware)
        const user = await db.User.findByPk(Number(req.user?.userId));
  
        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }
  
        // 2. Validation: Don't resend if already verified
        if (type === "email_verification" && user.email_verified) {
          return res.status(400).json({
            success: false,
            message: "This email is already verified. Please log in.",
          });
        }
  
        // 3. Generate OTP with Cooldown check
        const { otp, cooldownRemaining } = await OTPService.generateOTP(user.email, type);
  
        // If cooldownRemaining exists and NO otp was returned, it means the lockout is active
        if (cooldownRemaining && !otp) {
          return res.status(429).json({
            success: false,
            message: `Please wait ${cooldownRemaining} seconds before requesting a new code.`,
            retryAfter: cooldownRemaining,
          });
        }
  
        // 4. Handle Email Dispatch
        let emailResult;
        const mailPayload = {
          name: user.first_name,
          otp: otp!,
          to: user.email,
        };
  
        switch (type) {
          case "email_verification":
            emailResult = await mailService.sendEmailVerification(mailPayload);
            break;
  
          case "mfa":
            emailResult = await mailService.sendMfaOTP(mailPayload);
            break;
  
          case "password_reset":
            // Added the password reset email dispatch
            emailResult = await mailService.sendPasswordResetEmail(mailPayload);
            break;
  
          default:
            return res.status(400).json({
              success: false,
              message: "Unsupported resend type.",
            });
        }
  
        // 5. Handle Mail Service Failures
        if (emailResult?.error) {
          await OTPService.deleteOTP(user.email, type);
          return res.status(500).json({
            success: false,
            message: "Failed to send the code. Please try again later.",
          });
        }
  
        return res.status(200).json({
          success: true,
          message: "A new 6-digit code has been sent to your email.",
          // Return the NEW incremental cooldown time to the frontend
          cooldownSeconds: cooldownRemaining 
        });
  
      } catch (error: any) {
        console.error("Resend OTP Error:", error);
        return res.status(500).json({
          success: false,
          message: "An internal error occurred.",
        });
      }
    };
  };