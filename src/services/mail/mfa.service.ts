import fs from 'fs';
import path from 'path';
import sendMail from "../../configs/resend.ts";
import config from "../../configs/env.ts";

type Payload = {
    to: string;
    name: string;
    otp: string;
}

export const sendMfaOTP = async (payload: Payload) => {
    try {
        const templatePath = path.join("src","mailtemplates","mfaOTP.html");
        
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
            from: "onboarding@resend.dev",
            to: payload.to,
            subject: `${payload.otp} is your ${config.NAME} login verification code`,
            html: htmlContent
        });

        return { success: true, error };
    } catch (error) {
        console.error("EMAIL_SERVICE_ERROR:", error);
        return { success: false, error };
    }
};