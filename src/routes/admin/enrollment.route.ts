import { Router } from "express";
import type { Router as RouterType } from "express";
import { AdminEnrollmentController } from "../../controllers/admin/enrollment.controller.ts";
import { authenticate } from "../../middlewares/auth.ts";
import { hasRole } from "../../middlewares/role.ts";

const router: RouterType = Router();

/**
 * @swagger
 * /api/v1/admin/enrollments/{enrollmentId}/regenerate-qr:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Regenerate QR for an enrollment and email it
 *     parameters:
 *       - name: enrollmentId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR regenerated and emailed
 */

// POST /api/v1/admin/enrollments/:enrollmentId/regenerate-qr
router.post(
  "/:enrollmentId/regenerate-qr",
  authenticate,
  hasRole(["super-admin", "event-organiser"]),
  AdminEnrollmentController.regenerateQr,
);

export default router;
