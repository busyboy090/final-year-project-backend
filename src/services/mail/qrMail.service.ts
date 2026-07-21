import fs from "fs";
import path from "path";
import sendMail from "../../config/resend.ts";
import { fileURLToPath } from "url";
import config from "../../config/env.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Payload = {
  to: string;
  firstName: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  qrDataUrl: string; // Data URL
  checkinUrl: string;
  expiry: string;
};

export const sendEventRegistrationWithQR = async (payload: Payload) => {
  try {
    const templatePath = path.join(
      __dirname,
      "..",
      "..",
      "mailtemplates",
      "eventRegistrationWithQR.html",
    );
    let htmlContent = fs.readFileSync(templatePath, "utf8");

    htmlContent = htmlContent
      .replace(/{{firstName}}/g, payload.firstName)
      .replace(/{{eventTitle}}/g, payload.eventTitle)
      .replace(/{{eventDate}}/g, payload.eventDate)
      .replace(/{{venue}}/g, payload.venue)
      .replace(/{{checkinUrl}}/g, payload.checkinUrl)
      .replace(/{{expiry}}/g, payload.expiry);

    // Data URLs in <img src> are blocked/stripped by Gmail, Outlook, and
    // several other major mail clients. Send the QR as a proper inline
    // (CID) attachment instead — referenced as `cid:qrcode` in the template
    // — which renders reliably everywhere.
    const match = /^data:(image\/\w+);base64,(.+)$/.exec(payload.qrDataUrl);
    const qrContentType = match?.[1] ?? "image/png";
    const qrBase64 = match?.[2] ?? payload.qrDataUrl;

    // Always send directly. Queueing is handled by callers/workers to avoid double-enqueue loops.
    const { error } = await sendMail({
      from: `noreply@${config.DOMAIN}`,
      to: payload.to,
      subject: `Registration: ${payload.eventTitle}`,
      html: htmlContent,
      props: {
        attachments: [
          {
            filename: "qrcode.png",
            content: qrBase64,
            contentType: qrContentType,
            contentId: "qrcode",
          },
        ],
      },
    });

    return { success: true, error };
  } catch (error) {
    console.error("QR_MAIL_SERVICE_ERROR:", error);
    return { success: false, error };
  }
};

export default sendEventRegistrationWithQR;