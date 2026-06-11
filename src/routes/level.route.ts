import { Router } from "express";
import { LevelController } from "../controllers/level.controller.ts";
import { authenticate } from "../middlewares/auth.ts";
import { requireSuperAdmin } from "../middlewares/role.ts";

const router: Router = Router();

/**
 * @swagger
 * /api/v1/levels:
 *   get:
 *     tags:
 *       - Levels
 *     summary: Browse levels for profile setup or event filtering
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of levels
 */
router.get("/", authenticate, LevelController.getAllLevels);

/**
 * @swagger
 * /api/v1/levels:
 *   post:
 *     tags:
 *       - Levels
 *     summary: Create a new level (admin)
 *     security:
 *       - bearerAuth: []
 */
router.post("/", authenticate, requireSuperAdmin, LevelController.createLevel);

export default router;
