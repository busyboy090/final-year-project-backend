import fs from "fs";
import path from "path";
import sendMail from "../../config/resend.ts";
import config from "../../config/env.ts";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type SetPasswordPayload = {
  to: string;
  name: string;
  token: string;
};

export const sendSetPasswordEmail = async (payload: SetPasswordPayload) => {
  try {
    const templatePath = path.join(
      __dirname,
      "..",
      "..",
      "mailtemplates",
      "setPassword.html",
    );

    // Read the file
    let htmlContent = fs.readFileSync(templatePath, "utf8");

    // Construct the set password link
    const setPasswordLink = `${config.FRONTEND_URL}/auth/set-password?token=${payload.token}`;

    // Inject variables into the {{variableName}} placeholders
    htmlContent = htmlContent
      .replace(/{{firstName}}/g, payload.name)
      .replace(/{{setPasswordLink}}/g, setPasswordLink)
      .replace(/{{platformName}}/g, config.NAME)
      .replace(/{{year}}/g, new Date().getFullYear().toString());

    // Send the email using your Resend config
    const { error } = await sendMail({
      from: `noreply@${config.DOMAIN}`,
      to: payload.to,
      subject: `Complete Your ${config.NAME} Account Setup`,
      html: htmlContent,
    });

    return { success: !error, error };
  } catch (error) {
    console.error("SET_PASSWORD_EMAIL_SERVICE_ERROR:", error);
    return { success: false, error };
  }
};
