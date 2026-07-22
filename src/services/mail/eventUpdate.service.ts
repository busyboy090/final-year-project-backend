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
  /** Human-readable descriptions of what changed, e.g. "Venue changed from X to Y" */
  changes: string[];
};

export const sendEventUpdateEmail = async (payload: Payload) => {
  try {
    const templatePath = path.join(
      __dirname,
      "..",
      "..",
      "mailtemplates",
      "eventUpdate.html",
    );
    let htmlContent = fs.readFileSync(templatePath, "utf8");

    const changesList = (payload.changes && payload.changes.length
      ? payload.changes
      : ["Event details were updated."]
    )
      .map((change) => `<li>${change}</li>`)
      .join("");

    htmlContent = htmlContent
      .replace(/{{firstName}}/g, payload.firstName ?? "")
      .replace(/{{eventTitle}}/g, payload.eventTitle)
      .replace(/{{eventDate}}/g, payload.eventDate)
      .replace(/{{venue}}/g, payload.venue ?? "")
      .replace(/{{changesList}}/g, changesList)
      .replace(/{{year}}/g, String(new Date().getFullYear()));

    const { error } = await sendMail({
      from: `noreply@${config.DOMAIN}`,
      to: payload.to,
      subject: `Event Updated: ${payload.eventTitle}`,
      html: htmlContent,
    });

    return { success: true, error };
  } catch (error) {
    console.error("EVENT_UPDATE_MAIL_SERVICE_ERROR:", error);
    return { success: false, error };
  }
};

export default sendEventUpdateEmail;