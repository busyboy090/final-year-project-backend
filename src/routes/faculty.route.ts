import { Router } from 'express';
import { FacultyController } from '../controllers/faculty.controller.ts';
import { authenticate } from '../middlewares/auth.ts';
import { requireSuperAdmin } from '../middlewares/role.ts';
import { validate } from '../middlewares/validate.ts';
import {
  createFacultySchema,
  updateFacultySchema,
  facultyParamsSchema
} from '../validators/faculty.schema.ts';

const router: Router = Router();

/**
 * GET /api/v1/faculties
 * Discovery: Allows authenticated users to fetch all faculties with departments.
 */
router.get(
  '/',
  authenticate,
  FacultyController.getAllFaculties
);

/**
 * GET /api/v1/faculties/:id
 * Details: Returns a single faculty with its nested departments.
 */
router.get(
  '/:id',
  authenticate,
  validate(facultyParamsSchema),
  FacultyController.getFacultyById
);

/**
 * POST /api/v1/faculties
 * Management: Super Admin only. Creates a new faculty.
 */
router.post(
  '/',
  authenticate,
  requireSuperAdmin,
  validate(createFacultySchema),
  FacultyController.createFaculty
);

/**
 * PATCH /api/v1/faculties/:id
 * Management: Super Admin only. Partially updates a faculty.
 */
router.patch(
  '/:id',
  authenticate,
  requireSuperAdmin,
  validate(updateFacultySchema),
  FacultyController.updateFaculty
);

/**
 * DELETE /api/v1/faculties/:id
 * Management: Super Admin only. Removes a faculty from the system.
 */
router.delete(
  '/:id',
  authenticate,
  requireSuperAdmin,
  validate(facultyParamsSchema),
  FacultyController.deleteFaculty
);

export default router;