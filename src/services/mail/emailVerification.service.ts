import fs from 'fs';
import path from 'path';
import sendMail from "../../configs/resend.ts";
import config from "../../configs/env.ts";
import { fileURLToPath } from 'url';

type Payload = {
    to: string;
    name: string;
    otp: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sendEmailVerification = async (payload: Payload) => {
    try {
        const templatePath = path.join(__dirname, '..', '..', 'mailtemplates', 'emailVerification.html');
        
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
            subject: 'Verify your email address',
            html: htmlContent
        });

        return { success: true, error };
    } catch (error) {
        console.error("EMAIL_SERVICE_ERROR:", error);
        return { success: false, error };
    }
};