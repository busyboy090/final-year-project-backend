import { Router } from "express";
import enrollmentAdminRoutes from "./admin/enrollment.route.ts";

const router: Router = Router();

router.use("/enrollments", enrollmentAdminRoutes);

export default router;
