import { Router } from "express";
import enrollmentAdminRoutes from "./admin/enrollment.route.ts";
import reportAdminRoutes from "./admin/report.route.ts";

const router: Router = Router();

/**
 * @swagger
 * /api/v1/admin:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Admin root (delegates to sub-resources)
 *     description: Mount point for admin-only endpoints. Use subpaths such as `/admin/enrollments` and `/admin/events/...`.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin API root
 */

// Sub-route mounting
router.use("/enrollments", enrollmentAdminRoutes);
router.use("/", reportAdminRoutes);

export default router;
