import bcrypt from "bcrypt";
import db from "../../models/index.ts";
import type { RegisterUserInput } from "../../validators/auth/register.schema.ts";
import { generate2FASecret, generateQRCode } from "./2fa.service.ts";
import { sendEmailVerification } from "../mail/emailVerification.service.ts";
import { OTPService } from "./otp.service.ts";
import { generateTempToken } from "../../utils/jwt.ts";
import * as format from "../../utils/format.ts";

type PublicUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  email_verified: boolean;
  role: "administrator" | "organiser" | "user";
  is_active: boolean;
  two_factor_enabled: boolean;
  created_at: Date;
  updated_at: Date;
};

type RegisterUserResult = {
  ok: boolean;
  user?: PublicUser;
  reason?: string;
  tempToken?: string;
  twoFactorQRCode?: string;
  twoFactorSecret?: string;
  verificationEmailSent?: boolean;
};

export const registerUser = async (payload: RegisterUserInput & { role?: string }): Promise<RegisterUserResult> => {
  // Use a transaction to ensure data integrity
  const transaction = await db.sequelize.transaction();

  try {
    const existingUser = await db.User.findOne({ where: { email: payload.email } });
    if (existingUser) {
      await transaction.rollback();
      return { ok: false, reason: "EMAIL_EXISTS" };
    }

    const hashedPassword = await bcrypt.hash(payload.password, 12);

    let twoFactorSecret: string | null = null;
    let qrCode: string | undefined;

    if (payload.role === "administrator") {
      const { secret, otpauth } = generate2FASecret(payload.email);
      twoFactorSecret = secret;
      qrCode = await generateQRCode(otpauth);
    }

    const createdUser = await db.User.create({
      first_name: format.capitalizeInitial(payload.first_name),
      last_name: format.capitalizeInitial(payload.last_name),
      email: payload.email,
      password: hashedPassword,
      role: payload.role || "user",
      email_verified: false,
      two_factor_enabled: !!twoFactorSecret, 
      two_factor_secret: twoFactorSecret,
      is_active: true
    }, { transaction });

    const { otp } = await OTPService.generateOTP(createdUser.email, "email_verification")

    // Use your dedicated mail service with the HTML template
    const emailResult = await sendEmailVerification({
      name: createdUser.first_name,
      otp: otp,
      to: createdUser.email
    });

    if (emailResult.error) {
      await transaction.rollback(); // Rollback user creation if email fails
      await OTPService.deleteOTP(createdUser.email, "email-verification")
      return { ok: false, reason: "VERIFICATION_EMAIL_SEND_FAILED" };
    }

    // Commit changes to the DB
    await transaction.commit();

    const user: PublicUser = {
      id: createdUser.id,
      first_name: createdUser.first_name,
      last_name: createdUser.last_name,
      email: createdUser.email,
      email_verified: createdUser.email_verified,
      role: "user",
      two_factor_enabled: createdUser.two_factor_enabled,
      is_active: createdUser.is_active,
      created_at: createdUser.created_at,
      updated_at: createdUser.updated_at,
    };

    return {
      ok: true,
      user,
      verificationEmailSent: true,
      tempToken: generateTempToken({ userId: String(createdUser.id), email: createdUser.email, type: "email_verification" }, "15m"),
      ...(qrCode && { twoFactorQRCode: qrCode }),
      ...(twoFactorSecret && { twoFactorSecret: twoFactorSecret }),
    };

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("CRITICAL_REGISTRATION_ERROR:", error);
    return { ok: false, reason: "INTERNAL_SERVER_ERROR" };
  }
};