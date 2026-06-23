import { Router } from "express";
import { AcademicSessionController } from "../controllers/academic-session.controller.ts";
import { authenticate } from "../middlewares/auth.ts";
import { requireSuperAdmin } from "../middlewares/role.ts";

const router: Router = Router();

router.get("/", authenticate, AcademicSessionController.getAllSessions);
router.get("/current", authenticate, AcademicSessionController.getCurrentSession);
router.post("/", authenticate, requireSuperAdmin, AcademicSessionController.createSession);
router.patch("/:id", authenticate, requireSuperAdmin, AcademicSessionController.updateSession);
router.patch("/:id/current", authenticate, requireSuperAdmin, AcademicSessionController.setCurrentSession);
router.delete("/:id", authenticate, requireSuperAdmin, AcademicSessionController.deleteSession);

export default router;
