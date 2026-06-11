import { Router } from "express";
import type { Router as RouterType } from "express";
import { AdminReportController } from "../../controllers/admin/report.controller.ts";
import { authenticate } from "../../middlewares/auth.ts";
import { hasRole } from "../../middlewares/role.ts";

const router: RouterType = Router();

router.get(
  "/events/:eventId/attendance/export",
  authenticate,
  hasRole(["super-admin", "event-organiser"]),
  AdminReportController.exportAttendanceCsv,
);

export default router;
