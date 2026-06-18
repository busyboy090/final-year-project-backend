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
 *     description: Enroll the authenticated user into an approved event. The event audience rules are enforced here as a backend security check, even if the event was hidden from the user's list view.
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
 *             required:
 *               - eventId
 *             properties:
 *               eventId:
 *                 type: integer
 *                 example: 12
 *     responses:
 *       201:
 *         description: Enrollment created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: You have successfully registered for the event.
 *                 data:
 *                   $ref: '#/components/schemas/Enrollment'
 *       400:
 *         description: Registration failed or invalid event id.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       403:
 *         description: Event is full, not approved, or not available to the authenticated user's audience.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *             examples:
 *               audienceRestricted:
 *                 summary: User does not match event audience rules
 *                 value:
 *                   success: false
 *                   message: This event is not available to your audience.
 *               eventFull:
 *                 summary: Event capacity reached
 *                 value:
 *                   success: false
 *                   message: Event capacity reached.
 *       409:
 *         description: User is already registered for this event.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Enrollment'
 *                       - type: object
 *                         properties:
 *                           event:
 *                             $ref: '#/components/schemas/Event'
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Enrollment'
 *       404:
 *         $ref: '#/components/schemas/ErrorMessage'
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       404:
 *         $ref: '#/components/schemas/ErrorMessage'
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     event_id:
 *                       type: integer
 *                     total_enrolled:
 *                       type: integer
 *                     total_attended:
 *                       type: integer
 *                     total_cancelled:
 *                       type: integer
 *                     no_show:
 *                       type: integer
 *                     attendance_rate:
 *                       oneOf:
 *                         - type: string
 *                         - type: number
 *       404:
 *         $ref: '#/components/schemas/ErrorMessage'
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
 *             required:
 *               - token
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
