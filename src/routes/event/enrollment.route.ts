import { Router } from "express";
import { EnrollmentController } from "../../controllers/event/enrollment.controller.ts";
import { authenticate } from "../../middlewares/auth.ts";
import CheckinRoute from "./checkin.route.ts";

const router: Router = Router();

/**
 * @swagger
 * /api/v1/events/enrollments/join:
 *   post:
 *     tags:
 *       - Enrollments
 *     summary: Join an event
 *     description: Enroll the authenticated user into an event.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CsrfHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Enrollment created
 */
router.post("/join", authenticate, EnrollmentController.join);

/**
 * @swagger
 * /api/v1/events/enrollments/me:
 *   get:
 *     tags:
 *       - Enrollments
 *     summary: Get my enrollments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user enrollments
 */
router.get("/me", authenticate, EnrollmentController.getMyEvents);

/**
 * @swagger
 * /api/v1/events/enrollments/{enrollmentId}/check-in:
 *   patch:
 *     tags:
 *       - Enrollments
 *     summary: Check-in to an event (authenticated)
 *     parameters:
 *       - name: enrollmentId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Checked in
 */
router.patch(
  "/:enrollmentId/check-in",
  authenticate,
  EnrollmentController.checkIn,
);

/**
 * @swagger
 * /api/v1/events/enrollments/{enrollmentId}/cancel:
 *   patch:
 *     tags:
 *       - Enrollments
 *     summary: Cancel enrollment
 *     parameters:
 *       - name: enrollmentId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enrollment cancelled
 */
router.patch(
  "/:enrollmentId/cancel",
  authenticate,
  EnrollmentController.cancelEnrollment,
);

/**
 * @swagger
 * /api/v1/events/{eventId}/enrollments/stats:
 *   get:
 *     tags:
 *       - Enrollments
 *     summary: Get event attendance stats
 *     parameters:
 *       - name: eventId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance statistics
 */
router.get(
  "/:eventId/stats",
  authenticate,
  EnrollmentController.getAttendanceStats,
);

/**
 * @swagger
 * /api/v1/events/enrollments/checkin-with-token:
 *   post:
 *     tags:
 *       - Enrollments
 *     summary: Check-in using QR token (public)
 *     description: Allows scanners to check-in users with a one-time QR token. No authentication required.
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
router.use("/enrollments/checkin-with-token", CheckinRoute);

export default router;
