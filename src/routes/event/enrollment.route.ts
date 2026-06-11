import { Router } from 'express';
import { EnrollmentController } from '../../controllers/event/enrollment.controller.ts';
import { authenticate } from '../../middlewares/auth.ts';
import CheckinRoute from './checkin.route.ts';

const router:Router = Router();

/**
 * POST /api/v1/events/enrollments/join
 * Join an event
 */
router.post('/join', authenticate, EnrollmentController.join);

/**
 * GET /api/v1/events/enrollments/me
 * View your personal dashboard of upcoming events
 */
router.get('/me', authenticate, EnrollmentController.getMyEvents);

/**
 * PATCH /api/v1/events/enrollments/:enrollmentId/check-in
 * Check-in to an event
 */
router.patch('/:enrollmentId/check-in', authenticate, EnrollmentController.checkIn);

/**
 * PATCH /api/v1/events/enrollments/:enrollmentId/cancel
 * Cancel enrollment (unenroll from event)
 */
router.patch('/:enrollmentId/cancel', authenticate, EnrollmentController.cancelEnrollment);

/**
 * GET /api/v1/events/:eventId/enrollments/stats
 * Get attendance statistics for an event (admin/organizer only)
 */
router.get('/:eventId/stats', authenticate, EnrollmentController.getAttendanceStats);

router.use("/enrollments/checkin-with-token", authenticate, CheckinRoute);

export default router;