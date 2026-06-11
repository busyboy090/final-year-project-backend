import type { Request, Response } from "express";
import db from "../../models/index.ts";

export const checkinWithToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token)
      return res
        .status(400)
        .json({ success: false, message: "Token is required" });

    // Find enrollment by persistent token
    const enrollment = await db.EventEnrollment.findOne({
      where: { qr_token: token },
      include: [{ model: db.Event, as: "event" }],
    });

    if (!enrollment)
      return res
        .status(404)
        .json({
          success: false,
          message: "Invalid token or enrollment not found",
        });

    // Ensure event is currently active/approved
    const event = enrollment.event;
    if (!event || event.status !== "approved") {
      return res
        .status(403)
        .json({ success: false, message: "Event is not active" });
    }

    const now = new Date();
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);

    // Ensure within allowed check-in window
    if (now < start || now > end) {
      return res
        .status(403)
        .json({ success: false, message: "Event not in check-in window" });
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

    // Mark as checked in
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
  