import { Router } from 'express';
import { FacultyController } from '../controllers/faculty.controller.ts';
import { authenticate } from '../middlewares/auth.ts';
import { hasPermission, hasRole } from '../middlewares/role.ts';

const router:Router = Router();

/**
 * GET /api/v1/faculties
 * Discovery: Allows students and staff to fetch faculties and their departments
 * for profile completion and event filtering.
 */
router.get(
  '/', 
  authenticate, 
  FacultyController.getAllFaculties
);

/**
 * GET /api/v1/faculties/:id
 * Details: Provides specific faculty details including nested departments.
 */
router.get(
  '/:id', 
  authenticate, 
  FacultyController.getFacultyById
);

/**
 * POST /api/v1/faculties
 * Management: Restricted to Super Admins.
 * Permissions: Requires 'manage_structure' slug.
 */
router.post(
  '/', 
  authenticate, 
  hasPermission('manage_structure'),
  hasRole(['super-admin']),
  FacultyController.createFaculty
);

export default router;