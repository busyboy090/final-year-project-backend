import bcrypt from "bcrypt";
import db from "../../models/index.ts";
import { OTPService } from "./otp.service.ts";
import * as mailService from "../mail/index.ts";

export const ResetPasswordService = {
    /**
     * Step 1: Initiate Reset
     * Checks user existence and sends the 6-digit code
     */
    async requestReset(email: string) {
        const user = await db.User.findOne({ where: { email } });

        if (!user) {
            // Security Tip: Don't reveal if a user exists. 
            // Return success even if email isn't in DB.
            return { ok: true };
        }

        // Generate OTP with the type "password_reset"
        const { otp, cooldownRemaining } = await OTPService.generateOTP(email, "password_reset");

        if (cooldownRemaining && !otp) {
            return { ok: false, reason: "COOLDOWN_ACTIVE", cooldownRemaining };
        }

        // Send the email
        const { error } = await mailService.sendPasswordResetEmail({
            to: user.email,
            name: user.first_name,
            otp: otp!,
        });

        if (error) {
            await OTPService.deleteOTP(email, "password_reset");
            throw new Error("FAILED_TO_SEND_EMAIL");
        }

        return { ok: true, cooldownRemaining };
    },

    /**
     * Step 2: Reset Password
     */
    async executeReset(payload: { userId: any; newPassword: string }) {
        return db.sequelize.transaction(async (t: any) => {
            const { userId, newPassword } = payload;

            // Find the user
            const user = await db.User.findOne({ where: { id: Number(userId) } }, { transaction: t });
            if (!user) {
                return { ok: false, reason: "USER_NOT_FOUND" };
            }

            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 12);

            // Update the database
            await user.update({ password: hashedPassword }, { transaction: t });

            // Send a confirmation email
            const { error } = await mailService.sendPasswordChangedNotification();

            if(error) throw new Error("Failed to send password chnaged notificationn.")

            return { ok: true };
        })
    }
};