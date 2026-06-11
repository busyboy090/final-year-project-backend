import type { Request, Response } from "express";
import db from "../../models/index.ts";
import {
  generateRandomToken,
  generateQrImageBase64,
} from "../../services/qr.service.ts";
import qrQueue from "../../queues/qrQueue.ts";
import { sendEventRegistrationWithQR } from "../../services/mail/qrMail.service.ts";

export class AdminEnrollmentController {
  static async regenerateQr(req: Request, res: Response) {
    try {
      const enrollmentId = Number(req.params.enrollmentId);
      const enrollment = await db.EventEnrollment.findByPk(enrollmentId, {
        include: [
          { model: db.Event, as: "event" },
          { model: db.User, as: "user" },
        ],
      });
      if (!enrollment)
        return res
          .status(404)
          .json({ success: false, message: "Enrollment not found" });

      // Generate new token and save
      const token = generateRandomToken();
      await enrollment.update({
        qr_token: token,
        qr_issued_at: new Date(),
      } as any);

      // Build QR and email payload
      const checkinUrl = `${process.env.FRONTEND_ORIGIN || process.env.API_ORIGIN || ""}/v1/events/enrollments/checkin-with-token?token=${encodeURIComponent(token)}`;
      const qrDataUrl = await generateQrImageBase64(checkinUrl);

      const user =
        enrollment.user ?? (await db.User.findByPk(enrollment.user_id));

      const payload = {
        to: user?.email ?? "no-reply",
        firstName: user?.first_name ?? "",
        eventTitle: String(enrollment.event?.title ?? ""),
        eventDate: String(enrollment.event?.start_date ?? ""),
        venue: enrollment.event?.venue?.name ?? "",
        qrDataUrl,
        checkinUrl,
        expiry: "persistent",
      };

      // Enqueue or send directly
      try {
        if (qrQueue && typeof qrQueue.add === "function") {
          await qrQueue.add(payload, { attempts: 3, backoff: 5000 });
        } else {
          await sendEventRegistrationWithQR(payload);
        }
      } catch (err) {
        console.error("QR_EMAIL_REGEN_ERROR:", err);
      }

      return res
        .status(200)
        .json({
          success: true,
          message: "QR regenerated and emailed",
          data: { enrollment },
        });
    } catch (error) {
      console.error("ADMIN_REGEN_QR_ERROR:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
}

export default AdminEnrollmentController;
