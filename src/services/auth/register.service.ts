import bcrypt from "bcrypt";
import db from "../../models/index.ts";
import type { RegisterUserInput } from "../../validators/auth/register.schema.ts";
import { sendEmailVerification } from "../mail/emailVerification.service.ts";
import { OTPService } from "./otp.service.ts";
import { generateTempToken } from "../../utils/jwt.ts";
import * as format from "../../utils/format.ts";
import type { PublicUser, UserRole } from "../../types/user.d.ts";

type RegisterUserResult = {
  ok: boolean;
  user?: PublicUser;
  reason?: string;
  tempToken?: string;
  twoFactorQRCode?: string;
  twoFactorSecret?: string;
  verificationEmailSent?: boolean;
};

export const registerUser = async (
  payload: RegisterUserInput & { role?: string | string[] }
): Promise<RegisterUserResult> => {
  // 1. Pre-check: Ensure roles are normalized and not empty
  const rawRoles = payload.role || "student";
  const targetRoleCodes = Array.isArray(rawRoles) ? rawRoles : [rawRoles];

  const transaction = await db.sequelize.transaction();

  try {
    // 2. Check for existing user BEFORE creating anything
    const existingUser = await db.User.findOne({ where: { email: payload.email } });
    if (existingUser) {
      await transaction.rollback();
      return { ok: false, reason: "EMAIL_EXISTS" };
    }

    // 3. Resolve Roles with explicit typing to avoid 'any' errors
    const roleRecords = await db.Role.findAll({ 
      where: { code: targetRoleCodes },
      include: [{ 
        model: db.Permission, 
        as: 'permissions', 
        attributes: ['name'],
        through: { attributes: [] } // Cleans up the nested response
      }],
      transaction 
    });

    if (roleRecords.length === 0) {
      await transaction.rollback();
      return { ok: false, reason: "INVALID_ROLE" };
    }

    const hashedPassword = await bcrypt.hash(payload.password, 12);

    // 4. Create User
    const createdUser = await db.User.create({
      first_name: format.capitalizeInitial(payload.first_name),
      last_name: format.capitalizeInitial(payload.last_name),
      email: payload.email,
      password: hashedPassword,
      email_verified: false,
      is_active: true
    }, { transaction });

    // 5. Create UserRole Links
    const userRoleLinks = roleRecords.map((role:any) => ({
      user_id: createdUser.id,
      role_id: role.id
    }));

    await db.UserRole.bulkCreate(userRoleLinks, { transaction });

    // 6. OTP Generation - Handle potential nulls safely
    const otpResult = await OTPService.generateOTP(createdUser.email, "email_verification");
    
    // Check if OTP was actually generated (handles cooldown logic)
    if (!otpResult.otp) {
        await transaction.rollback();
        return { ok: false, reason: "OTP_COOLDOWN_ACTIVE" };
    }

    const emailResult = await sendEmailVerification({
      name: createdUser.first_name,
      otp: otpResult.otp,
      to: createdUser.email
    });

    if (emailResult.error) {
      await transaction.rollback();
      return { ok: false, reason: "VERIFICATION_EMAIL_SEND_FAILED" };
    }

    // 7. Extracting flattened data safely
    const roleCodes = roleRecords.map((r:any) => r.code as UserRole);
    const permissions = [...new Set(
      roleRecords.flatMap((r:any) => r.permissions?.map((p: any) => p.name) || [])
    )] as string[];

    // 8. Commit the transaction
    await transaction.commit();

    return {
      ok: true,
      user: {
        id: createdUser.id,
        first_name: createdUser.first_name,
        last_name: createdUser.last_name,
        email: createdUser.email,
        email_verified: createdUser.email_verified,
        roles: roleCodes,
        permissions: permissions,
        two_factor_enabled: createdUser.two_factor_enabled,
        profile_picture_url: createdUser.profile_picture_url,
        is_active: createdUser.is_active,
        created_at: createdUser.created_at,
        updated_at: createdUser.updated_at,
      },
      verificationEmailSent: true,
      tempToken: generateTempToken({ 
          userId: String(createdUser.id), 
          email: createdUser.email, 
          type: "email_verification" 
      }, "15m"),
    };

  } catch (error) {
    // Check if transaction was initialized before rolling back
    if (transaction) await transaction.rollback();
    console.error("REGISTRATION_SERVICE_ERROR:", error);
    return { ok: false, reason: "INTERNAL_SERVER_ERROR" };
  }
};