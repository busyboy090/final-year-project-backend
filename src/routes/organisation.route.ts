import { Router } from 'express';
import { OrganisationController } from '../controllers/organisation.controller.ts';
import {
  createOrganisationSchema,
  updateOrganisationSchema,
  organisationIdParamSchema,
  organisationQuerySchema,
} from '../validators/organisation.schema.ts';
import { validate } from '../middlewares/validate.ts';
import { requireSuperAdmin } from '../middlewares/role.ts';
import { authenticate } from '../middlewares/auth.ts';

const router: Router = Router();

/**
 * @route   GET /api/organisations
 * @desc    List all organisations (paginated, filterable)
 * @access  Private
 */
router.get(
  '/',
  validate(organisationQuerySchema),
  OrganisationController.getAll
);

/**
 * @route   GET /api/organisations/:id
 * @desc    Get a single organisation by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(organisationIdParamSchema),
  OrganisationController.getById
);


router.use(authenticate, requireSuperAdmin);

/**
 * @route   POST /api/organisations
 * @desc    Create a new organisation
 * @access  Private
 */
router.post(
  '/',
  validate(createOrganisationSchema),
  OrganisationController.create
);

/**
 * @route   PATCH /api/organisations/:id
 * @desc    Update an existing organisation
 * @access  Private
 */
router.patch(
  '/:id',
  validate(updateOrganisationSchema),
  OrganisationController.update
);

/**
 * @route   DELETE /api/organisations/:id
 * @desc    Delete an organisation
 * @access  Private
 */
router.delete(
  '/:id',
  validate(organisationIdParamSchema),
  OrganisationController.delete
);

export default router;