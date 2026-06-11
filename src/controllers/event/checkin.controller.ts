import type { Request, Response } from "express";
import { verifySignedToken } from "../../services/qr.service.ts";
import db from "../../models/index.ts";

export const checkinWithToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token)
      return res
        .status(400)
        .json({ success: false, message: "Token is required" });

    const verification = verifySignedToken(token);
    if (!verification.ok)
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });

    const { enrollmentId, userId, eventId } = verification.data as any;

    const enrollment = await db.EventEnrollment.findByPk(enrollmentId);
    if (!enrollment)
      return res
        .status(404)
        .json({ success: false, message: "Enrollment not found" });

    if (enrollment.event_id !== eventId || enrollment.user_id !== userId) {
      return res
        .status(400)
        .json({ success: false, message: "Token does not match enrollment" });
    }

    if (enrollment.status === "cancelled") {
      return res
        .status(403)
        .json({ success: false, message: "Enrollment is cancelled" });
    }

    if (enrollment.check_in_time) {
      return res
        .status(409)
        .json({ success: false, message: "Already checked in" });
    }

    await enrollment.update({ check_in_time: new Date(), status: "attended" });

    return res
      .status(200)
      .json({
        success: true,
        message: "Checked in successfully",
        data: enrollment,
      });
  } catch (error) {
    console.error("CHECKIN_ROUTE_ERROR:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
  