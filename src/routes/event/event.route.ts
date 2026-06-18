import { Router } from "express";
import { EventController } from "../../controllers/event/create.controller.ts";
import { authenticate } from "../../middlewares/auth.ts";
import { hasRole } from "../../middlewares/role.ts";
import EnrollmentRoutes from "./enrollment.route.ts";
import * as EventMiddleware from "../../middlewares/event.ts";
import { validate } from "../../middlewares/validate.ts";
import * as EventSchema from "../../validators/event/create.schema.ts";
import { upload } from "../../config/multer.ts";
import { EnrollmentController } from "../../controllers/event/enrollment.controller.ts";

const router: Router = Router();

/**
 * @swagger
 * /api/v1/events/analytics/dashboard:
 *   get:
 *     tags:
 *       - Events
 *     summary: Get dashboard analytics
 *     description: Returns aggregated statistics (for admin/organiser)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get(
  "/analytics/dashboard",
  authenticate,
  EventController.getDashboardStats,
);

// Relational Routing Groups
router.use("/enrollments", EnrollmentRoutes);

/**
 * @swagger
 * /api/v1/events/{id}:
 *   get:
 *     tags:
 *       - Events
 *     summary: Get event details
 *     description: Returns one event with venue, organisation, calculated fill percentage, and audience rules. Staff/student users receive 403 if the event does not match their audience profile.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       403:
 *         description: Event exists but is not available to the authenticated user's audience.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       404:
 *         $ref: '#/components/schemas/ErrorMessage'
 */
router.get("/:id", authenticate, EventController.getById);

/**
 * @swagger
 * /api/v1/events:
 *   get:
 *     tags:
 *       - Events
 *     summary: List events
 *     description: Returns a paginated list of events with optional filters. Staff/student users only receive events matching their audience profile; super-admins and event organisers can see all matching events.
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, cancelled]
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *           enum:
 *             - Academic Conference
 *             - Workshop
 *             - Cultural Event
 *             - Sports Match
 *             - Exhibition/Expo
 *             - Social Gathering/Party
 *       - name: organisation_id
 *         in: query
 *         schema:
 *           type: integer
 *       - name: venue_id
 *         in: query
 *         schema:
 *           type: integer
 *       - name: created_by
 *         in: query
 *         schema:
 *           type: integer
 *       - name: start_date_from
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: start_date_to
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 pages:
 *                   type: integer
 */
router.get("/", authenticate, EventController.list);

/**
 * @swagger
 * /api/v1/events:
 *   post:
 *     tags:
 *       - Events
 *     summary: Create a new event
 *     description: Create an event application as an organiser or super-admin. The schedule is submitted as discrete date/time fields. Audience fields control who can discover and register for the event after approval.
 *     parameters:
 *       - $ref: '#/components/parameters/CsrfHeader'
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/EventCreateRequest'
 *           encoding:
 *             audience_rules:
 *               contentType: application/json
 *           examples:
 *             everyone:
 *               summary: Event open to all authenticated staff and students
 *               value:
 *                 title: Campus Leadership Forum
 *                 category: Workshop
 *                 description: A leadership workshop for the university community.
 *                 venue_id: 2
 *                 capacity: 120
 *                 startDate: "2026-06-18"
 *                 startTime: "10:00"
 *                 endDate: "2026-06-18"
 *                 endTime: "12:00"
 *                 audience_scope: all
 *             academicStaffOnly:
 *               summary: Event restricted to academic staff
 *               value:
 *                 title: Faculty Research Briefing
 *                 category: Academic Conference
 *                 description: Internal briefing for academic staff members.
 *                 venue_id: 3
 *                 capacity: 80
 *                 startDate: "2026-06-20"
 *                 startTime: "09:00"
 *                 endDate: "2026-06-20"
 *                 endTime: "11:00"
 *                 audience_scope: custom
 *                 audience_rules: '[{"role":"staff","staff_type":"academic-staff","level_id":null,"gender":null}]'
 *             female400LevelStudents:
 *               summary: Event restricted to female 400 level students
 *               value:
 *                 title: Final Year Mentorship Session
 *                 category: Workshop
 *                 description: Mentorship session for selected final year students.
 *                 venue_id: 4
 *                 capacity: 60
 *                 startDate: "2026-06-22"
 *                 startTime: "14:00"
 *                 endDate: "2026-06-22"
 *                 endTime: "16:00"
 *                 audience_scope: custom
 *                 audience_rules: '[{"role":"student","staff_type":null,"level_id":4,"gender":"female"}]'
 *     responses:
 *       201:
 *         description: Event created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Validation error, invalid date range, invalid custom audience, or missing thumbnail.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ErrorMessage'
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *       409:
 *         description: Venue unavailable or requested capacity exceeds venue limit.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
router.post(
  "/",
  authenticate,
  hasRole(["event-organiser", "super-admin"]),
  upload.fields([{ name: "thumbnail", maxCount: 1 }]),
  validate(EventSchema.eventSchema),
  EventController.create,
);

/**
 * @swagger
 * /api/v1/events/{id}:
 *   patch:
 *     tags:
 *       - Events
 *     summary: Update event
 *     description: Updates event fields. If audience_scope or audience_rules is supplied, the event audience configuration is replaced. Custom audiences require at least one rule.
 *     parameters:
 *       - $ref: '#/components/parameters/CsrfHeader'
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventUpdateRequest'
 *           examples:
 *             restrictToStudents:
 *               summary: Restrict an event to all students
 *               value:
 *                 audience_scope: custom
 *                 audience_rules:
 *                   - role: student
 *                     level_id: null
 *                     staff_type: null
 *                     gender: null
 *             openToEveryone:
 *               summary: Remove audience restrictions
 *               value:
 *                 audience_scope: all
 *                 audience_rules: []
 *     responses:
 *       200:
 *         description: Event updated
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
 *                   example: Event updated
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Validation error, invalid date range, or venue unavailable.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ErrorMessage'
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *       403:
 *         $ref: '#/components/schemas/ErrorMessage'
 *       404:
 *         $ref: '#/components/schemas/ErrorMessage'
 */
router.patch(
  "/:id",
  authenticate,
  hasRole(["event-organiser", "super-admin"]),
  EventMiddleware.verifyEventOwner,
  validate(EventSchema.updateEventSchema),
  EventController.update,
);

/**
 * @swagger
 * /api/v1/events/{id}:
 *   delete:
 *     tags:
 *       - Events
 *     summary: Delete an event (soft/hard)
 *     parameters:
 *       - $ref: '#/components/parameters/CsrfHeader'
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Event deleted or cancelled
 */
router.delete(
  "/:id",
  authenticate,
  hasRole(["event-organiser", "super-admin"]),
  EventMiddleware.verifyEventOwner,
  EventController.delete,
);

/**
 * @swagger
 * /api/v1/events/{id}/status:
 *   patch:
 *     tags:
 *       - Events
 *     summary: Update event status (approve/reject)
 *     parameters:
 *       - $ref: '#/components/parameters/CsrfHeader'
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         $ref: '#/components/schemas/ValidationErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/ErrorMessage'
 */
router.patch(
  "/:id/status",
  authenticate,
  hasRole(["super-admin"]),
  validate(EventSchema.updateEventStatusSchema),
  EventController.updateStatus,
);

/**
 * @swagger
 * /api/v1/events/{id}/cancel:
 *   patch:
 *     tags:
 *       - Events
 *     summary: Cancel an event
 *     parameters:
 *       - $ref: '#/components/parameters/CsrfHeader'
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Event cancelled
 */
router.patch(
  "/:id/cancel",
  authenticate,
  hasRole(["event-organiser", "super-admin"]),
  EventMiddleware.verifyEventOwner,
  EventController.cancel,
);

/**
 * @swagger
 * /api/v1/events/{id}/registrants/export:
 *   get:
 *     tags:
 *       - Events
 *     summary: Export registrants to CSV
 *     description: Export detailed registrant list as a CSV file (for organisers).
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file of registrants
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  "/:id/registrants/export",
  authenticate,
  hasRole(["event-organiser", "super-admin"]),
  EventMiddleware.verifyEventOwner,
  EnrollmentController.exportRegistrantsCSV
);

export default router;
