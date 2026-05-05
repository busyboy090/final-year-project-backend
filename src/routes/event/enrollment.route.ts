import { Router } from 'express';
import { EnrollmentController } from '../../controllers/event/enrollment.controller.ts';
import { authenticate } from '../../middlewares/auth.ts';

const router:Router = Router();

/**
 * POST /api/v1/enrollments/join
 * Join an Admiralty University event
 */
router.post('/join', authenticate, EnrollmentController.join);

/**
 * GET /api/v1/enrollments/me
 * View your personal dashboard of upcoming events
 */
router.get('/me', authenticate, EnrollmentController.getMyEvents);

export default router;