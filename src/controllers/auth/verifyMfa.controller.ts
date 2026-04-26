import type { Request, Response } from "express";
import db from "../../models/index.ts";
import { OTPService } from "../../services/auth/otp.service.ts";
import * as jwt from "../../utils/jwt.ts"
import config from "../../configs/env.ts"

export const verifyMfaController = async (req: Request, res: Response) => {
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
        const isValid = await OTPService.verifyOTP(user.email, "mfa", otp);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code",
                code: "INVALID_OTP"
            });
        }

        // Prepare Success Response ...
        const tokenPayload = { userId: String(user.id), email: user.email, role: user.role };

        // clear temp token
        res.clearCookie("tempToken");

        // Set the Refresh Token in an HTTP-only cookie
        res.cookie("refreshToken", jwt.generateRefreshToken(tokenPayload), {
            httpOnly: true,
            signed: true,
            secure: config.NODE_ENV === "production", // Only send over HTTPS in production
            sameSite: "strict", // Prevents CSRF
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (match your JWT expiry)
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role,
                is_active: user.is_active,
                created_at: user.created_at,
                updated_at: user.updated_at,
            },
            accessToken: jwt.generateAccessToken(tokenPayload),
        })

    } catch (error) {
        console.error("Verify MFA OTP Error:", error);
            return res.status(500).json({
                success: false,
                message: "An internal error occurred.",
            });
    }
}