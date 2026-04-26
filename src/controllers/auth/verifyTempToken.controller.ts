import type { Request, Response } from "express";
import { verifyTempToken } from "../../utils/jwt.ts";
import db from "../../models/index.ts";
import { OTPService } from "../../services/auth/otp.service.ts";

export const verifyTempTokenController = (type: string) => {
    return async (req: Request, res: Response) => {
        try {
            // 1. Extract the tempToken from the HTTP-only cookie
            const tempToken = req.signedCookies.tempToken;

            if (!tempToken) {
                return res.status(401).json({
                    success: false,
                    message: "Verification session expired. Please log in again.",
                    code: "INVALID_TOKEN"
                });
            }

            // 2. Verify the token using your utility
            const decoded = verifyTempToken(tempToken) as { 
                userId: string; 
                email: string; 
                type: string 
            };

            // 3. --- CHECK THE TYPE ---
            // Ensure the user is trying to verify for the correct reason (e.g., 'mfa' vs 'email_verification')
            if (decoded.type.toLowerCase() !== type.toLowerCase()) {
                return res.status(403).json({
                    success: false,
                    message: "Invalid session type for this action.",
                    code: "INVALID_TOKEN"
                });
            }

            // 4. Find user 
            const user = await db.User.findByPk(Number(decoded.userId));

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found.",
                });
            }

            // 5. --- CHECK COOLDOWN TIME ---
            // We ask Redis how much time is left for this user's specific OTP type
            const cooldownRemaining = await OTPService.getCooldown(user.email, type);

            // 6. Return success with user data and cooldown
            return res.status(200).json({
                success: true,
                message: "Session is valid",
                email: user.email,
                first_name: user.first_name,
                cooldownRemaining: cooldownRemaining // This sends 0 if no cooldown is active
            });

        } catch (error: any) {
            if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
                return res.status(403).json({
                    success: false,
                    message: "Your session has expired. Please log in to request a new code.",
                    code: "INVALID_TOKEN"
                });
            }

            console.error("Verify Temp Token Error:", error);
            return res.status(500).json({
                success: false,
                message: "An internal error occurred.",
            });
        }
    };
};