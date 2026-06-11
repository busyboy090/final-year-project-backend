import db from "../../models/index.ts";

export class CheckinService {
  static async checkinWithToken(token: string, scanner_id?: string) {
    try {
      const enrollment = await db.EventEnrollment.findOne({
        where: { qr_token: token },
        include: [
          { model: db.Event, as: "event" },
          { model: db.User, as: "user" },
        ],
      });

      if (!enrollment) {
        return {
          ok: false,
          code: 404,
          message: "Invalid token or enrollment not found",
        };
      }

      const event = enrollment.event;
      if (!event || event.status !== "approved") {
        return { ok: false, code: 403, message: "Event is not active" };
      }

      const now = new Date();
      const start = new Date(event.start_date);
      const end = new Date(event.end_date);

      if (now < start || now > end) {
        return {
          ok: false,
          code: 403,
          message: "Event not in check-in window",
        };
      }

      if (enrollment.status === "cancelled") {
        return { ok: false, code: 403, message: "Enrollment is cancelled" };
      }

      if (enrollment.status === "attended" || enrollment.check_in_time) {
        return {
          ok: false,
          code: 409,
          message: "Already checked in",
          data: {
            status: enrollment.status,
            check_in_time: enrollment.check_in_time,
          },
        };
      }

      // Mark as checked in, clear token (one-time use)
      await enrollment.update({
        check_in_time: new Date(),
        status: "attended",
        qr_token: null,
      } as any);
      await enrollment.reload();

      // Create audit log record (if model/table exists)
      try {
        if (db.EnrollmentCheckin) {
          await db.EnrollmentCheckin.create({
            enrollment_id: enrollment.id,
            scanner_id: scanner_id ?? null,
            checked_in_at: enrollment.check_in_time || new Date(),
          } as any);
        }
      } catch (auditErr) {
        console.error("CHECKIN_AUDIT_ERROR:", auditErr);
      }

      return {
        ok: true,
        code: 200,
        message: "Checked in successfully",
        data: enrollment,
      };
    } catch (error) {
      console.error("CHECKIN_SERVICE_ERROR:", error);
      return { ok: false, code: 500, message: "Internal server error" };
    }
  }
}

export default CheckinService;
