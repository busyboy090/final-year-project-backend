import fs from "fs";
import path from "path";
import sendMail from "../../config/resend.ts";
import { fileURLToPath } from "url";
import config from "../../config/env.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Payload = {
  to: string;
  firstName?: string;
  eventTitle: string;
  eventDate: string;
  venue?: string;
  reason?: string;
};

export const sendEventCancellationEmail = async (payload: Payload) => {
  try {
    const templatePath = path.join(
      __dirname,
      "..",
      "..",
      "mailtemplates",
      "eventCancellation.html",
    );
    let htmlContent = fs.readFileSync(templatePath, "utf8");

    htmlContent = htmlContent
      .replace(/{{firstName}}/g, payload.firstName ?? "")
      .replace(/{{eventTitle}}/g, payload.eventTitle)
      .replace(/{{eventDate}}/g, payload.eventDate)
      .replace(/{{venue}}/g, payload.venue ?? "")
      .replace(/{{reason}}/g, payload.reason ?? "");

    const { error } = await sendMail({
      from: `noreply@${config.DOMAIN}`,
      to: payload.to,
      subject: `Event Cancelled: ${payload.eventTitle}`,
      html: htmlContent,
    });

    return { success: true, error };
  } catch (error) {
    console.error("CANCELLATION_MAIL_SERVICE_ERROR:", error);
    return { success: false, error };
  }
};

export default sendEventCancellationEmail;
