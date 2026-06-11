import db from "../../models/index.ts";
import env from "../../config/env.ts";
import {
  generateRandomToken,
  generateQrImageBase64,
} from "../../services/qr.service.ts";
import { sendEventRegistrationWithQR } from "../mail/qrMail.service.ts";
import qrQueue from "../../queues/qrQueue.ts";

type EnrollmentResult = {
  ok: boolean;
  data?: any;
  reason?:
    | "EVENT_NOT_FOUND"
    | "EVENT_NOT_APPROVED"
    | "ALREADY_ENROLLED"
    | "EVENT_FULL"
    | "INTERNAL_SERVER_ERROR";
};

export class EnrollmentService {
  /**
   * Enrolls a student or staff member in an event
   */
  static async enrollInEvent(
    eventId: number,
    userId: number,
  ): Promise<EnrollmentResult> {
    try {
      // 1. Verify event exists and is approved
      const event = await db.Event.findByPk(eventId, {
        include: [{ model: db.Venue, as: "venue" }],
      });
      if (!event) return { ok: false, reason: "EVENT_NOT_FOUND" };
      if (event.status !== "approved")
        return { ok: false, reason: "EVENT_NOT_APPROVED" };

      // 2. Prevent duplicate enrollment (include user data)
      const existing = await db.EventEnrollment.findOne({
        where: { event_id: eventId, user_id: userId },
        include: [{ model: db.User, as: "user" }],
      });
      if (existing && existing.status !== "cancelled") {
        return { ok: false, reason: "ALREADY_ENROLLED" };
      }

      // 3. Check venue capacity limits
      const count = await db.EventEnrollment.count({
        where: { event_id: eventId, status: "confirmed" },
      });
      if (event.capacity && count >= event.capacity) {
        return { ok: false, reason: "EVENT_FULL" };
      }

      // If there is an existing cancelled enrollment, reactivate and resend QR
      if (existing) {
        await existing.update({
          status: "confirmed",
          check_in_time: null,
        } as any);

        // Generate persistent QR token and save on enrollment
        try {
          const token = generateRandomToken();
          await existing.update({
            qr_token: token,
            qr_issued_at: new Date(),
          } as any);

          const origin =
            env.FRONTEND_ORIGIN || env.FRONTEND_URL || env.API_ORIGIN || "";
          const checkinUrl = `${origin}/v1/events/enrollments/checkin-with-token?token=${encodeURIComponent(
            token,
          )}`;
          const qrDataUrl = await generateQrImageBase64(checkinUrl);

          const user = existing.user ?? (await db.User.findByPk(userId));

          const payload = {
            to: user?.email ?? "no-reply",
            firstName: user?.first_name ?? "",
            eventTitle: String(event.title),
            eventDate: String(event.start_date),
            venue: event.venue?.name ?? "",
            qrDataUrl,
            checkinUrl,
            expiry: "persistent",
          };

          if (qrQueue && typeof qrQueue.add === "function") {
            await qrQueue.add(
              { jobType: "registration", payload },
              { attempts: 3, backoff: 5000 },
            );
          } else {
            void sendEventRegistrationWithQR(payload);
          }
        } catch (err) {
          console.error("QR_EMAIL_SEND_ERROR:", err);
        }

        return { ok: true, data: existing };
      }

      // 4. Create enrollment record
      const token = generateRandomToken();
      const enrollment = await db.EventEnrollment.create({
        event_id: eventId,
        user_id: userId,
        status: "confirmed",
        qr_token: token,
        qr_issued_at: new Date(),
      } as any);

      // Generate QR image and send email to user
      try {
        const origin =
          env.FRONTEND_ORIGIN || env.FRONTEND_URL || env.API_ORIGIN || "";
        const checkinUrl = `${origin}/v1/events/enrollments/checkin-with-token?token=${encodeURIComponent(
          token,
        )}`;
        const qrDataUrl = await generateQrImageBase64(checkinUrl);

        // Fetch user email/name if available
        const user = await db.User.findByPk(userId);

        const payload = {
          to: user?.email ?? "no-reply",
          firstName: user?.first_name ?? "",
          eventTitle: String(event.title),
          eventDate: String(event.start_date),
          venue: event.venue?.name ?? "",
          qrDataUrl,
          checkinUrl,
          expiry: "persistent",
        };

        if (qrQueue && typeof qrQueue.add === "function") {
          await qrQueue.add(
            { jobType: "registration", payload },
            { attempts: 3, backoff: 5000 },
          );
        } else {
          void sendEventRegistrationWithQR(payload);
        }
      } catch (err) {
        console.error("QR_EMAIL_SEND_ERROR:", err);
      }

      return { ok: true, data: enrollment };
    } catch (error) {
      console.error("ENROLLMENT_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Fetches the authenticated user's personal event schedule
   */
  static async getMyEnrollments(userId: number) {
    return await db.EventEnrollment.findAll({
      where: { user_id: userId },
      include: [
        {
          model: db.Event,
          as: "event",
          include: ["venue"],
        },
      ],
    });
  }

  /**
   * Mark user as checked-in to an event
   */
  static async checkInToEvent(
    enrollmentId: number,
    userId: number,
  ): Promise<EnrollmentResult> {
    try {
      const enrollment = await db.EventEnrollment.findByPk(enrollmentId);
      if (!enrollment) return { ok: false, reason: "EVENT_NOT_FOUND" };

      // Verify ownership
      if (enrollment.user_id !== userId) {
        return { ok: false, reason: "INTERNAL_SERVER_ERROR" };
      }

      // Update check-in time
      await enrollment.update({
        check_in_time: new Date(),
        status: "attended",
      });

      return { ok: true, data: enrollment };
    } catch (error) {
      console.error("CHECK_IN_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Cancel enrollment (unenroll from event)
   */
  static async cancelEnrollment(
    enrollmentId: number,
    userId: number,
  ): Promise<EnrollmentResult> {
    try {
      const enrollment = await db.EventEnrollment.findByPk(enrollmentId);
      if (!enrollment) return { ok: false, reason: "EVENT_NOT_FOUND" };

      // Verify ownership
      if (enrollment.user_id !== userId) {
        return { ok: false, reason: "INTERNAL_SERVER_ERROR" };
      }

      // Update status to cancelled
      await enrollment.update({ status: "cancelled" });

      return {
        ok: true,
        data: { message: "Enrollment cancelled", enrollment },
      };
    } catch (error) {
      console.error("CANCEL_ENROLLMENT_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Get event attendance statistics
   */
  static async getEventAttendanceStats(
    eventId: number,
  ): Promise<EnrollmentResult> {
    try {
      const event = await db.Event.findByPk(eventId);
      if (!event) return { ok: false, reason: "EVENT_NOT_FOUND" };

      const totalEnrollments = await db.EventEnrollment.count({
        where: { event_id: eventId },
      });
      const attended = await db.EventEnrollment.count({
        where: { event_id: eventId, status: "attended" },
      });
      const cancelled = await db.EventEnrollment.count({
        where: { event_id: eventId, status: "cancelled" },
      });

      const stats = {
        event_id: eventId,
        total_enrolled: totalEnrollments,
        total_attended: attended,
        total_cancelled: cancelled,
        no_show: totalEnrollments - attended - cancelled,
        attendance_rate:
          totalEnrollments > 0
            ? ((attended / totalEnrollments) * 100).toFixed(2)
            : 0,
      };

      return { ok: true, data: stats };
    } catch (error) {
      console.error("ATTENDANCE_STATS_SERVICE_ERROR:", error);
      throw error;
    }
  }
}

export default EnrollmentService;
