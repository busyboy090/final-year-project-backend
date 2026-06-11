import { Router } from "express";
import type { Router as RouterType } from "express";
import { AdminReportController } from "../../controllers/admin/report.controller.ts";
import { authenticate } from "../../middlewares/auth.ts";
import { hasRole } from "../../middlewares/role.ts";
import { verifyEventOwner } from "../../middlewares/event.ts";

const router: RouterType = Router();

/**
 * @swagger
 * /api/v1/admin/users/export:
 *   get:
 *     tags:
 *       - admin
 *     summary: Export full users CSV (admin only)
 *     description: Allows a super-admin to export user details (excluding sensitive secrets) as CSV.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file download
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/users/export",
  authenticate,
  hasRole(["super-admin"]),
  AdminReportController.exportUsersCsv,
);

/**
 * @swagger
 * /api/v1/admin/events/{eventId}/attendance/export:
 *   get:
 *     tags:
 *       - admin
 *     summary: Export attendance CSV for an event (organiser or admin)
 *     description: Allows the event organiser (owner) or super-admin to export attendance for the event.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: eventId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: CSV file download
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event not found
 */
router.get(
  "/events/:eventId/attendance/export",
  authenticate,
  // requireSuperAdmin OR the event owner; verifyEventOwner allows super-admins through
  verifyEventOwner,
  AdminReportController.exportAttendanceCsv,
);

export default router;
