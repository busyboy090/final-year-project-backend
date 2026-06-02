import { Router } from 'express';
import { EventController } from '../../controllers/event/create.controller.ts';
import { authenticate } from '../../middlewares/auth.ts';
import { hasRole } from '../../middlewares/role.ts';
import EnrollmentRoutes from './enrollment.route.ts';
import * as EventMiddleware from "../../middlewares/event.ts"

const router: Router = Router();

// Base Event Handling Endpoints
router.get('/', authenticate, EventController.list);
router.post('/', authenticate, hasRole(["event-organiser", "super-admin"]), EventController.create);
router.patch('/:id', authenticate, EventController.update);

// Specialized Sub-resource Workflows
router.patch('/:id/status', authenticate, hasRole(['super-admin']), EventController.updateStatus);
router.patch('/:id/cancel', authenticate, hasRole(["event-organiser", "super-admin"]), EventMiddleware.verifyEventOwner, EventController.cancel);

// Relational Routing Groups
router.use('/enrollments', EnrollmentRoutes);

export default router;