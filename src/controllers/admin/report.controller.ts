import type { Request, Response } from "express";
import db from "../../models/index.ts";

export class AdminReportController {
  static async exportAttendanceCsv(req: Request, res: Response) {
    try {
      const eventId = Number(req.params.eventId);
      const event = await db.Event.findByPk(eventId);
      if (!event)
        return res
          .status(404)
          .json({ success: false, message: "Event not found" });

      const enrollments = await db.EventEnrollment.findAll({
        where: { event_id: eventId },
        include: [{ model: db.User, as: "user" }],
        order: [["id", "ASC"]],
      });

      // Build CSV header
      const headers = [
        "Enrollment ID",
        "User ID",
        "First Name",
        "Last Name",
        "Email",
        "Status",
        "Check-in Time",
        "QR Issued At",
      ];

      const rows = enrollments.map((e: any) => {
        const user = e.user ?? ({} as any);
        return [
          e.id,
          e.user_id,
          (user.first_name ?? "").replace(/"/g, '""'),
          (user.last_name ?? "").replace(/"/g, '""'),
          (user.email ?? "").replace(/"/g, '""'),
          e.status,
          e.check_in_time ? new Date(e.check_in_time).toISOString() : "",
          e.qr_issued_at ? new Date(e.qr_issued_at).toISOString() : "",
        ] as Array<string | number>;
      });

      // Convert to CSV string (simple RFC4180 escaping)
      const csvLines: string[] = [];
      csvLines.push(
        headers
          .map((h: string) => `"${String(h).replace(/"/g, '""')}"`)
          .join(","),
      );
      for (const r of rows) {
        const line = (r as Array<any>)
          .map((cell: any) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(",");
        csvLines.push(line);
      }

      const csv = csvLines.join("\r\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="attendance_event_${eventId}.csv"`,
      );
      res.status(200).send(csv);
    } catch (error) {
      console.error("EXPORT_ATTENDANCE_ERROR:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  static async exportUsersCsv(_req: Request, res: Response) {
    try {
      const users = await db.User.findAll({
        order: [["id", "ASC"]],
      });

      const headers = [
        "User ID",
        "First Name",
        "Last Name",
        "Email",
        "Role",
        "Email Verified",
        "Is Active",
        "Phone",
        "Gender",
        "Created At",
      ];

      const rows = users.map(
        (u: any) =>
          [
            u.id,
            (u.first_name ?? "").replace(/"/g, '""'),
            (u.last_name ?? "").replace(/"/g, '""'),
            (u.email ?? "").replace(/"/g, '""'),
            u.role,
            u.email_verified ? "true" : "false",
            u.is_active ? "true" : "false",
            (u.phone ?? "").replace(/"/g, '""'),
            u.gender ?? "",
            u.created_at ? new Date(u.created_at).toISOString() : "",
          ] as Array<string | number>,
      );

      const csvLines: string[] = [];
      csvLines.push(
        headers
          .map((h: string) => `"${String(h).replace(/"/g, '""')}"`)
          .join(","),
      );

      for (const r of rows) {
        const line = (r as Array<any>)
          .map((cell: any) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(",");
        csvLines.push(line);
      }

      const csv = csvLines.join("\r\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="users_full_export.csv"`,
      );
      res.status(200).send(csv);
    } catch (error) {
      console.error("EXPORT_USERS_ERROR:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
}

export default AdminReportController;
