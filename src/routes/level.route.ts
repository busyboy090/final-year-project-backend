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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Level'
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
 *     parameters:
 *       - $ref: '#/components/parameters/CsrfHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LevelRequest'
 *     responses:
 *       201:
 *         description: Level created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Level'
 *       400:
 *         $ref: '#/components/schemas/ValidationErrorResponse'
 */
router.post("/", authenticate, requireSuperAdmin, LevelController.createLevel);

export default router;
