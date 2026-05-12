import { OTPService } from './otp.service.ts';
import bcrypt from "bcrypt";
import db from "../../models/index.ts";
import { generateAccessToken, generateRefreshToken, generateTempToken } from "../../utils/jwt.ts";
import * as mailService from "../mail/index.ts";
import type { PublicUser, UserRole } from '../../types/user.d.ts';
import { ProfileService } from '../user/profile.service.ts';

type LoginUserResult = {
  ok: boolean;
  user?: PublicUser;
  tempToken?: string;
  accessToken?: string;
  refreshToken?: string;
  needsProfileCompletion?: boolean;
  reason?: "INVALID_CREDENTIALS" | "EMAIL_NOT_VERIFIED" | "INACTIVE_ACCOUNT" | "MFA_REQUIRED" | "VERIFICATION_EMAIL_SEND_FAILED" | "MFA_OTP_EMAIL_SEND_FAILED";
  cooldownRemaining?: number;
};

export const loginUser = async (payload: { email: string; password: string }): Promise<LoginUserResult> => {
  try {
    // 1. Fetch User with Many-to-Many Roles and Permissions
    const user = await db.User.scope("withSecrets").findOne({
      where: { email: payload.email },
      include: [{
        model: db.Role,
        as: 'roles',
        include: [{ model: db.Permission, as: 'permissions', attributes: ['name'] }]
      }]
    });

    if (!user || !user.password) return { ok: false, reason: "INVALID_CREDENTIALS" };
    if (!(await bcrypt.compare(payload.password, user.password))) return { ok: false, reason: "INVALID_CREDENTIALS" };

    // 2. Verification Checks (Email & MFA)
    if (!user.email_verified) {
        const { otp, cooldownRemaining } = await OTPService.generateOTP(user.email, "email_verification");
        
        if (cooldownRemaining && !otp) {
          return { 
            ok: false, 
            reason: "EMAIL_NOT_VERIFIED", 
            cooldownRemaining, 
            tempToken: generateTempToken({ userId: String(user.id), type: "email_verification" }, "15m") 
          };
        }
  
        const { error } = await mailService.sendEmailVerification({
          to: user.email,
          name: user.first_name,
          otp: otp!
        });
  
        if (error) {
          await OTPService.deleteOTP(user.email, "email_verification");
          return { ok: false, reason: "VERIFICATION_EMAIL_SEND_FAILED" };
        }

        return { ok: false, reason: "EMAIL_NOT_VERIFIED", cooldownRemaining, tempToken: generateTempToken({ userId: String(user.id), type: "email_verification" }, "15m") };
    }
    if (!user.is_active) return { ok: false, reason: "INACTIVE_ACCOUNT" };

    // 3. Flatten Multi-Role & Permission Data
    const roleCodes = user.roles?.map((r: any) => r.code) as UserRole[] || [];
    const permissions = [...new Set(user.roles?.flatMap((r: any) => r.permissions?.map((p: any) => p.name)) || [])] as string[];

    // 4. Verify ALL required Profiles
    const allProfilesExist = await ProfileService.checkAllUserProfiles(user.id, roleCodes);

    const adminProfile = await db.AdminProfile.findOne({
      where: { user_id: user.id },
      attributes: ["is_super_admin"],
    });
    const isSuperAdminAccount = Boolean(adminProfile?.is_super_admin);
    
    const tokenPayload = { 
      userId: String(user.id), 
      email: user.email, 
      roles: roleCodes, 
      permissions: permissions 
    };

    return {
      ok: true,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        roles: roleCodes,
        permissions: permissions,
        email_verified: user.email_verified,
        is_active: user.is_active,
        two_factor_enabled: user.two_factor_enabled,
        profile_picture_url: user.profile_picture_url,
        created_at: user.created_at,
        updated_at: user.updated_at,
        is_super_admin: isSuperAdminAccount,
      },
      accessToken: generateAccessToken(tokenPayload),
      refreshToken: generateRefreshToken(tokenPayload),
      ...(!allProfilesExist && { needsProfileCompletion: true })
    };
  } catch (error) {
    console.error("LOGIN_SERVICE_ERROR:", error);
    throw error;
  }
};