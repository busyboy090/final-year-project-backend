import { OTPService } from './otp.service.ts';
import bcrypt from "bcrypt";
import db from "../../models/index.ts";
import { generateAccessToken, generateRefreshToken, generateTempToken } from "../../utils/jwt.ts";
import * as mailService from "../mail/index.ts";
import type { PublicUser } from '../../types/user.d.ts';
import { ProfileService } from '../user/profile.service.ts';

type LoginUserResult = {
  ok: boolean;
  user?: PublicUser;
  tempToken?: string;
  accessToken?: string;
  refreshToken?: string;
  needsProfileCompletion?: boolean;
  reason?: 
    | "INVALID_CREDENTIALS"
    | "EMAIL_NOT_VERIFIED"
    | "INACTIVE_ACCOUNT"
    | "MFA_REQUIRED"
    | "VERIFICATION_EMAIL_SEND_FAILED"
    | "MFA_OTP_EMAIL_SEND_FAILED";
  cooldownRemaining?: number;
};

export const loginUser = async (payload: {
  email: string;
  password: string;
}): Promise<LoginUserResult> => {
  try {
    // 1. Fetch user
    const user = await db.User.scope("withSecrets").findOne({
      where: { email: payload.email },
    });

    if (!user || !user.password) {
      return { ok: false, reason: "INVALID_CREDENTIALS" };
    }

    if (!(await bcrypt.compare(payload.password, user.password))) {
      return { ok: false, reason: "INVALID_CREDENTIALS" };
    }

    // 2. Email verification check
    if (!user.email_verified) {
      const { otp, cooldownRemaining } = await OTPService.generateOTP(
        user.email,
        "email_verification",
      );

      const tempToken = generateTempToken(
        { userId: String(user.id), type: "email_verification" },
        "15m",
      );

      // Still in cooldown — don't resend, just return remaining time
      if (cooldownRemaining && !otp) {
        return { ok: false, reason: "EMAIL_NOT_VERIFIED", cooldownRemaining, tempToken };
      }

      const { error } = await mailService.sendEmailVerification({
        to:   user.email,
        name: user.first_name,
        otp:  otp!,
      });

      if (error) {
        await OTPService.deleteOTP(user.email, "email_verification");
        return { ok: false, reason: "VERIFICATION_EMAIL_SEND_FAILED" };
      }

      return { ok: false, reason: "EMAIL_NOT_VERIFIED", cooldownRemaining, tempToken };
    }

    // 3. Active account check
    if (!user.is_active) {
      return { ok: false, reason: "INACTIVE_ACCOUNT" };
    }

    // 4. MFA check
    // if (user.two_factor_enabled) {
    //   const { otp, cooldownRemaining } = await OTPService.generateOTP(
    //     user.email,
    //     "mfa",
    //   );

    //   const tempToken = generateTempToken(
    //     { userId: String(user.id), type: "mfa" },
    //     "10m",
    //   );

    //   if (cooldownRemaining && !otp) {
    //     return { ok: false, reason: "MFA_REQUIRED", cooldownRemaining, tempToken };
    //   }

    //   const { error } = await mailService.sendMFAOTP({
    //     to:   user.email,
    //     name: user.first_name,
    //     otp:  otp!,
    //   });

    //   if (error) {
    //     await OTPService.deleteOTP(user.email, "mfa");
    //     return { ok: false, reason: "MFA_OTP_EMAIL_SEND_FAILED" };
    //   }

    //   return { ok: false, reason: "MFA_REQUIRED", cooldownRemaining, tempToken };
    // }

    // 5. Check profile completion
    const profileExists = await ProfileService.checkUserProfiles(user.id, user.role);

    const tokenPayload = {
      userId: String(user.id),
      email:  user.email,
      role:   user.role,
    };

    return {
      ok: true,
      user: {
        id:                  user.id,
        first_name:          user.first_name,
        last_name:           user.last_name,
        email:               user.email,
        role:                user.role,
        email_verified:      user.email_verified,
        is_active:           user.is_active,
        two_factor_enabled:  user.two_factor_enabled,
        profile_picture_url: user.profile_picture_url,
        created_at:          user.created_at,
        updated_at:          user.updated_at,
      },
      accessToken:  generateAccessToken(tokenPayload),
      refreshToken: generateRefreshToken(tokenPayload),
      ...(!profileExists && { needsProfileCompletion: true }),
    };
  } catch (error) {
    console.error("LOGIN_SERVICE_ERROR:", error);
    throw error;
  }
};