import { Router } from 'express';
import { EventController } from '../../controllers/event/create.controller.ts';
import { authenticate } from '../../middlewares/auth.ts';
import { hasRole } from '../../middlewares/role.ts';
import EnrollmentRoutes from './enrollment.route.ts';
import * as EventMiddleware from "../../middlewares/event.ts";
import { validate } from '../../middlewares/validate.ts';
import * as EventSchema from '../../validators/event/create.schema.ts';
import { upload } from '../../config/multer.ts';

const router: Router = Router();

// Base Event Handling Endpoints
router.get('/', authenticate, EventController.list);

/**
 * GET /api/events/:id
 * Get single event details
 */
router.get('/:id', authenticate, EventController.getById);

router.post('/', authenticate, hasRole(["event-organiser", "super-admin"]), upload.fields([{ name: 'thumbnail', maxCount: 1 }]), validate(EventSchema.eventSchema), EventController.create);
router.patch('/:id', authenticate, hasRole(["event-organiser", "super-admin"]), EventMiddleware.verifyEventOwner, validate(EventSchema.updateEventSchema), EventController.update);

/**
 * DELETE /api/events/:id
 * Delete/cancel event
 */
router.delete('/:id', authenticate, hasRole(["event-organiser", "super-admin"]), EventMiddleware.verifyEventOwner, EventController.delete);

/**
 * @route   GET /api/events/analytics/dashboard
 * @desc    Fetch aggregated system metrics and portfolio capacities
 * @access  Protected (Admin / Event Organisers)
 */
router.get(
  "/analytics/dashboard", 
  authenticate, 
  EventController.getDashboardStats
);

// Specialized Sub-resource Workflows
router.patch('/:id/status', authenticate, hasRole(['super-admin']), validate(EventSchema.updateEventStatusSchema), EventController.updateStatus);
router.patch('/:id/cancel', authenticate, hasRole(["event-organiser", "super-admin"]), EventMiddleware.verifyEventOwner, EventController.cancel);

// Relational Routing Groups
router.use('/enrollments', EnrollmentRoutes);

export default router;