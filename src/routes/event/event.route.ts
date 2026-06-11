import { Router } from "express";
import { EventController } from "../../controllers/event/create.controller.ts";
import { authenticate } from "../../middlewares/auth.ts";
import { hasRole } from "../../middlewares/role.ts";
import EnrollmentRoutes from "./enrollment.route.ts";
import * as EventMiddleware from "../../middlewares/event.ts";
import { validate } from "../../middlewares/validate.ts";
import * as EventSchema from "../../validators/event/create.schema.ts";
import { upload } from "../../config/multer.ts";

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
 *               $ref: '#/components/schemas/Event'
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
 *     description: Returns a paginated list of events with optional filters.
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
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
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
 */
router.get("/", authenticate, EventController.list);

/**
 * @swagger
 * /api/v1/events:
 *   post:
 *     tags:
 *       - Events
 *     summary: Create a new event
 *     description: Create event (organiser or super-admin). Upload thumbnail as multipart form-data.
 *     parameters:
 *       - $ref: '#/components/parameters/CsrfHeader'
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - start_date
 *               - end_date
 *               - venue_id
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               venue_id:
 *                 type: integer
 *               capacity:
 *                 type: integer
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Event created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
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
 *             type: object
 *     responses:
 *       200:
 *         description: Event updated
 *       403:
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
 *                 enum: [pending, approved, rejected, cancelled]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status updated
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

export default router;
