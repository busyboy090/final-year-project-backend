import { OTPService } from './otp.service.ts';
import bcrypt from "bcrypt";
import db from "../../models/index.ts";
import { generateAccessToken, generateRefreshToken, generateTempToken } from "../../utils/jwt.ts";
import * as  mailService from "../mail/index.ts";

/**
 * Public user type for safe API responses
 */
type PublicUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "administrator" | "organiser" | "user";
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

/**
 * Result type handling standard and MFA states
 */
type LoginUserResult = {
  ok: boolean;
  user?: PublicUser;
  tempToken?: string;
  accessToken?: string;
  refreshToken?: string;
  reason?:
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_VERIFIED"
  | "INACTIVE_ACCOUNT"
  | "MFA_REQUIRED"
  | "INVALID_2FA_TOKEN"
  | "VERIFICATION_EMAIL_SEND_FAILED"
  | "MFA_OTP_EMAIL_SEND_FAILED";
};

/**
 * Extended input to allow the optional 2FA token from the frontend
 */
interface ExtendedLoginInput {
  email: string;
  password: string;
}

export const loginUser = async (payload: ExtendedLoginInput): Promise<LoginUserResult & { cooldownRemaining?: number }> => {
  try {
    const user = await db.User.scope("withSecrets").findOne({
      where: { email: payload.email },
    });

    if (!user || !user.password) {
      return { ok: false, reason: "INVALID_CREDENTIALS" };
    }

    const passwordMatches = await bcrypt.compare(payload.password, user.password);
    if (!passwordMatches) {
      return { ok: false, reason: "INVALID_CREDENTIALS" };
    }

    // --- Handle Unverified Email ---
    if (!user.email_verified) {
      const { otp, cooldownRemaining } = await OTPService.generateOTP(user.email, "email_verification");

      // If cooldown is active, let the frontend know how long to wait
      if (cooldownRemaining && !otp) {
        return { ok: false, reason: "EMAIL_NOT_VERIFIED", cooldownRemaining, tempToken: generateTempToken({ userId: String(user.id), type: "email_verification" }, "15m") };
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

      return {
        ok: false,
        reason: "EMAIL_NOT_VERIFIED",
        cooldownRemaining,
        tempToken: generateTempToken({ userId: String(user.id), type: "email_verification" }, "15m")
      };
    }

    if (!user.is_active) {
      return { ok: false, reason: "INACTIVE_ACCOUNT" };
    }

    // --- Handle MFA Logic ---
    if (user.two_factor_enabled) {
      const { otp, cooldownRemaining } = await OTPService.generateOTP(user.email, "mfa");

      if (cooldownRemaining && !otp) {
        return { ok: false, reason: "MFA_REQUIRED", cooldownRemaining, tempToken: generateTempToken({ userId: String(user.id), type: "mfa" }, "15m") };
      }

      const { error } = await mailService.sendMfaOTP({
        to: user.email,
        name: user.first_name,
        otp: otp!
      });

      if (error) {
        await OTPService.deleteOTP(user.email, "mfa");
        return { ok: false, reason: "MFA_OTP_EMAIL_SEND_FAILED" };
      }

      return {
        ok: false,
        reason: "MFA_REQUIRED",
        tempToken: generateTempToken({ userId: String(user.id), type: "mfa" }, "15m")
      };
    }

    // --- Success Response (No MFA) ---
    const tokenPayload = { userId: String(user.id), email: user.email, role: user.role };
    return {
      ok: true,
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
      accessToken: generateAccessToken(tokenPayload),
      refreshToken: generateRefreshToken(tokenPayload),
    };
  } catch (error) {
    console.error("LOGIN_SERVICE_ERROR:", error);
    throw error;
  }
};