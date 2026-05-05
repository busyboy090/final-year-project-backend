import { Router } from 'express';
import { EventController } from '../../controllers/event/create.controller.ts';
import { authenticate } from '../../middlewares/auth.ts';
import { hasPermission, hasRole } from '../../middlewares/role.ts';
import EnrollmentRoutes from './enrollment.route.ts';

const router:Router = Router();

/**
 * GET /api/v1/events
 * Discovery: All authenticated students and staff can view event listings.
 */
router.get(
  '/', 
  authenticate, 
  EventController.list
);

/**
 * POST /api/v1/events
 * Creation: Allows users with 'create_events' permission to apply for a venue.
 */
router.post(
  '/', 
  authenticate, 
  hasPermission('create_events'), 
  EventController.create
);

/**
 * PATCH /api/v1/events/:id/status
 * Approval: Restricted to roles like 'Student Affairs' or 'Super Admin'.
 */
router.patch(
  '/:id', 
  authenticate, 
  hasPermission('approve_events'), 
  hasRole(['super-admin']),
  EventController.update
);

// Enrollment Routes
router.use('/enrollments', EnrollmentRoutes);

export default router;