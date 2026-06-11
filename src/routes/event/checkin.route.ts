import { Router } from "express";
import type { Router as RouterType } from "express";
import { checkinWithToken } from "../../controllers/event/checkin.controller.ts";

const router: RouterType = Router();

/**
 * @swagger
 * /api/v1/events/enrollments/checkin-with-token:
 *   post:
 *     tags:
 *       - Enrollments
 *     summary: Check-in using QR token (public)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               scanner_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Check-in result
 */
// POST /api/v1/events/enrollments/checkin-with-token
router.post("/", checkinWithToken);

export default router;
