// routes/department.routes.ts
import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller.ts';
import { authenticate } from '../middlewares/auth.ts';
import { requireSuperAdmin } from '../middlewares/role.ts';
import { validate } from '../middlewares/validate.ts';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  getDepartmentByIdSchema,
  deleteDepartmentSchema,
  getAllDepartmentsSchema,
} from '../validators/department.schema.ts';

const router: Router = Router();

/**
 * GET /api/v1/departments
 * Discovery: Returns a paginated, filterable list of departments.
 * Supports query params: page, limit, facultyId, type, search.
 */
router.get(
  '/',
  authenticate,
  validate(getAllDepartmentsSchema),
  DepartmentController.getAllDepartments
);

/**
 * GET /api/v1/departments/:id
 * Details: Returns a single department with its parent faculty.
 */
router.get(
  '/:id',
  authenticate,
  validate(getDepartmentByIdSchema),
  DepartmentController.getDepartmentById
);

/**
 * POST /api/v1/departments
 * Management: Super Admin only. Creates a new department.
 */
router.post(
  '/',
  authenticate,
  requireSuperAdmin,
  validate(createDepartmentSchema),
  DepartmentController.createDepartment
);

/**
 * PATCH /api/v1/departments/:id
 * Management: Super Admin only. Partially updates a department.
 */
router.patch(
  '/:id',
  authenticate,
  requireSuperAdmin,
  validate(updateDepartmentSchema),
  DepartmentController.updateDepartment
);

/**
 * DELETE /api/v1/departments/:id
 * Management: Super Admin only. Removes a department.
 * Note: faculty_id on affected users/events is SET NULL per FK constraint.
 */
router.delete(
  '/:id',
  authenticate,
  requireSuperAdmin,
  validate(deleteDepartmentSchema),
  DepartmentController.deleteDepartment
);

export default router;