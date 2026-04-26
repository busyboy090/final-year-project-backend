import { OTPService } from "../../services/auth/otp.service.ts";
import db from "../../models/index.ts";
import type { Request, Response } from "express";
import * as  mailService from "../../services/mail/index.ts";

export const resendOtpController = (type: string) => {
    return async (req: Request, res: Response) => {
        try {
            // Find User
            const user = await db.User.findByPk(Number(req.user?.userId));

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            // Validation Check: Don't resend if already verified
            if (type.toLowerCase() === "email_verification" && user.email_verified) {
                return res.status(400).json({
                    success: false,
                    message: "This email is already verified. Please log in.",
                });
            }

            // Generate new OTP (Redis overwrites the old one automatically)
            const otp = await OTPService.generateOTP(user.email);

            // Execute Mail Service based on type
            let emailResult;
            const mailPayload = {
                name: user.first_name,
                otp: otp,
                to: user.email
            };

            switch (type.toLowerCase()) {
                case "email_verification":
                    emailResult = await mailService.sendEmailVerification(mailPayload);
                    break;

                case "mfa":
                case "mfa_verification":
                    emailResult = await mailService.sendMfaOTP(mailPayload);
                    break;

                default:
                    return res.status(400).json({
                        success: false,
                        message: "Unsupported resend type.",
                    });
            }

            // Handle Email Service Errors
            if (emailResult?.error) {
                await OTPService.deleteOTP(user.email);
                return res.status(500).json({
                    success: false,
                    message: "Failed to send the code. Please try again later.",
                });
            }

            return res.status(200).json({
                success: true,
                message: "A new 6-digit code has been sent to your email.",
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