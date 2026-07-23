import { Router } from "express";
import type { Router as RouterType } from "express";
import { checkinWithToken } from "../../controllers/event/checkin.controller.ts";
import { hasRole } from "../../middlewares/role.ts";
import { authenticate } from "../../middlewares/auth.ts";

const router: RouterType = Router();

/**
 * @swagger
 * /api/v1/events/enrollments/checkin-with-token:
 *   post:
 *     tags:
 *       - Enrollments
 *     summary: Check-in using QR token
 *     description: Public endpoint used by QR scanners to check in an enrollment from a persistent QR token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: QR token issued during event registration.
 *               scanner_id:
 *                 type: string
 *                 nullable: true
 *                 description: Optional identifier for the scanner/device/operator.
 *     responses:
 *       200:
 *         description: Check-in result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/schemas/ErrorMessage'
 *       404:
 *         $ref: '#/components/schemas/ErrorMessage'
 */
// POST /api/v1/events/enrollments/checkin-with-token
router.post("/", authenticate, hasRole(["event-organiser", "super-admin"]),checkinWithToken);

export default router;
