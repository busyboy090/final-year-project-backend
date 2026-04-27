import fs from 'fs';
import path from 'path';
import sendMail from "../../configs/resend.ts";
import config from "../../configs/env.ts";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Payload = {
    to: string;
    name: string;
    otp: string;
}

export const sendPasswordResetEmail = async (payload: Payload) => {
    try {
        const templatePath = path.join(__dirname, '..', '..', 'mailtemplates', 'resetPasswordOTP.html');
        
        // Read the file
        let htmlContent = fs.readFileSync(templatePath, 'utf8');

        // Inject variables into the {{variableName}} placeholders
        htmlContent = htmlContent
            .replace(/{{firstName}}/g, payload.name)
            .replace(/{{otpCode}}/g, payload.otp)
            .replace(/{{platformName}}/g, config.NAME)
            .replace(/{{year}}/g, new Date().getFullYear().toString());

        // Send the email using your Resend config
        const { error } = await sendMail({
            from: `noreply@${config.DOMAIN}`,
            to: payload.to,
            subject: `${payload.otp} is your ${config.NAME} reset password verification code`,
            html: htmlContent
        });

        return { success: true, error };
    } catch (error) {
        console.error("EMAIL_SERVICE_ERROR:", error);
        return { success: false, error };
    }
};

export const sendPasswordChangedNotification = async () => {
    return { success: true, error: false }
};