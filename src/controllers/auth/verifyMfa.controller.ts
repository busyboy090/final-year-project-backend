import type { Request, Response } from "express";
import db from "../../models/index.ts";
import { OTPService } from "../../services/auth/otp.service.ts";
import * as jwt from "../../utils/jwt.ts"
import config from "../../config/env.ts";
import { ProfileService } from "../../services/user/profile.service.ts";
import type { UserRole } from "../../types/user.d.ts";

export const verifyMfaController = async (req: Request, res: Response) => {
    try {
        const { otp } = req.body;

        // 1. Find User with many-to-many Roles and their Permissions
        const user = await db.User.findByPk(Number(req.user?.userId), {
            include: [
                {
                    model: db.Role,
                    as: 'roles',
                    include: [{ 
                        model: db.Permission, 
                        as: 'permissions', 
                        attributes: ['name'] 
                    }]
                }
            ]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // 2. Verify OTP via Redis Service
        const isValid = await OTPService.verifyOTP(user.email, "mfa", otp);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code",
                code: "INVALID_OTP"
            });
        }

        // 3. Flatten Roles and Unique Permissions
        const roleCodes = user.roles?.map((r: any) => r.code) as UserRole[] || [];
        
        const permissions = [...new Set(
            user.roles?.flatMap((r: any) => r.permissions?.map((p: any) => p.name)) || []
        )] as string[];

        // 4. Multi-Role Profile Completion Check
        const allProfilesExist = await ProfileService.checkAllUserProfiles(user.id, roleCodes);

        // 5. Prepare Success Response & Multi-Role Tokens
        const tokenPayload = {
            userId: String(user.id),
            email: user.email,
            roles: roleCodes,
            permissions: permissions
        };

        // Clear the temp token (MFA session)
        res.clearCookie("tempToken");

        // Set the Refresh Token in an HTTP-only cookie
        res.cookie("refreshToken", jwt.generateRefreshToken(tokenPayload), {
            httpOnly: true,
            signed: true,
            secure: config.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                roles: roleCodes,
                permissions: permissions,
                is_active: user.is_active,
                created_at: user.created_at,
                updated_at: user.updated_at,
            },
            accessToken: jwt.generateAccessToken(tokenPayload),
            ...(!allProfilesExist && { needsProfileCompletion: true })
        });

    } catch (error) {
        console.error("Verify MFA OTP Error:", error);
        return res.status(500).json({
            success: false,
            message: "An internal error occurred.",
        });
    }
}