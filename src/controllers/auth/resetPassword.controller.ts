import { ResetPasswordService } from './../../services/auth/resetPassword.service.ts';
import type { Request, Response } from "express";
import { OTPService } from '../../services/auth/otp.service.ts';
import * as jwt from "../../utils/jwt.ts";
import db from '../../models/index.ts';
import config from "../../configs/env.ts"

export const requestResetPasswordController = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        const result = await ResetPasswordService.requestReset(email);

        // 1. Handle Cooldown (Rate Limiting)
        if (!result.ok && result.reason === "COOLDOWN_ACTIVE") {
            return res.status(429).json({
                success: false,
                message: `Please wait ${result.cooldownRemaining} seconds before requesting another reset code.`,
                retryAfter: result.cooldownRemaining,
            });
        }

        return res.status(200).json({
            success: true,
            message: "A 6-digit reset code has been sent.",
            cooldownRemaining: result.cooldownRemaining
        });

    } catch (error: any) {
        console.error("REQUEST_RESET_PASSWORD_ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "An internal error occurred. Please try again later."
        });
    }
};

export const verifyResetPasswordOTPController = async (req: Request, res: Response) => {
    try {
        const { otp, email } = req.body;

        // Verify OTP via Redis Service
        const isValid = await OTPService.verifyOTP(email, "password_reset", otp);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code",
                code: "INVALID_OTP"
            });
        }

        // find User
        const user = await db.User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        
        const tempToken = jwt.generateTempToken({ userId: String(user.id), type: "password_reset" }, "15m");

        res.cookie("tempToken", tempToken, {
            httpOnly: true,
            signed: true,
            secure: config.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000,
          });

        return res.status(200).json({
            success: true,
            message: "OTP verified sucessfully."
        });
    } catch (error) {
        console.error("Verify Reset Password Controller:", error);

        return res.status(500).json({
            success: false,
            message: "An internal error occurred. Please try again later."
        });
    }
} 

export const resetPasswordController = async (req: Request, res: Response) => {
    try {
      const { password } = req.body;
  
      // 1. Execute the reset/update logic
      const result = await ResetPasswordService.executeReset({ 
        userId: req.user?.userId, 
        newPassword: password
      });
  
      // 2. Handle Service Failures
      if (!result.ok) {
        return res.status(400).json({
          success: false,
          message: result.reason === "USER_NOT_FOUND" 
            ? "User account not found." 
            : "Failed to update password. Please try again."
        });
      }
  
      // 3. Handle Success
      return res.status(200).json({
        success: true,
        message: "Your password has been updated successfully."
      });
  
    } catch (error) {
      console.error("Reset Password Controller Error:", error);
  
      return res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later."
      });
    }
  };