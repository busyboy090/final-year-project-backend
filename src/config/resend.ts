import { Resend } from 'resend';
import env from './env.ts';

const resend = new Resend(env.RESEND_API_KEY);

interface SendMailOptions {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  /**
   * Additional props for Resend (e.g., cc, bcc, reply_to, attachments)
   */
  props?: Record<string, any>;
}

/**
 * Utility to send emails via Resend.
 * Supports both single and multiple recipients.
 */
const sendMail = async ({ from, to, subject, html, props }: SendMailOptions) => {
  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
      ...props
    });

    return { success: true, data };
  } catch (error) {
    console.error("❌ Resend: Error sending email:", error);
    return { success: false, error };
  }
};

export default sendMail;