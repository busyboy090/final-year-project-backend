import { Router } from "express";
import type { Router as RouterType } from "express";
import { AdminEnrollmentController } from "../../controllers/admin/enrollment.controller.ts";
import { authenticate } from "../../middlewares/auth.ts";
import { hasRole } from "../../middlewares/role.ts";

const router: RouterType = Router();

// POST /api/v1/admin/enrollments/:enrollmentId/regenerate-qr
router.post(
  "/:enrollmentId/regenerate-qr",
  authenticate,
  hasRole(["super-admin", "event-organiser"]),
  AdminEnrollmentController.regenerateQr,
);

export default router;
