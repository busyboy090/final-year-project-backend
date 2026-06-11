import { Router } from "express";
import enrollmentAdminRoutes from "./admin/enrollment.route.ts";
import reportAdminRoutes from "./admin/report.route.ts";

const router: Router = Router();

router.use("/enrollments", enrollmentAdminRoutes);
router.use("/", reportAdminRoutes);

export default router;
