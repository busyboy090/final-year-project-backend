import { Router } from "express";
import { OrganisationController } from "../controllers/organisation.controller.ts";
import {
  createOrganisationSchema,
  updateOrganisationSchema,
  organisationIdParamSchema,
  organisationQuerySchema,
} from "../validators/organisation.schema.ts";
import { validate } from "../middlewares/validate.ts";
import { requireSuperAdmin } from "../middlewares/role.ts";
import { authenticate } from "../middlewares/auth.ts";

const router: Router = Router();

/**
 * @swagger
 * /api/v1/organisations:
 *   get:
 *     tags:
 *       - Organisations
 *     summary: List all organisations (paginated/filterable)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of organisations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Organisation'
 */
router.get(
  "/",
  validate(organisationQuerySchema),
  OrganisationController.getAll,
);

/**
 * @swagger
 * /api/v1/organisations/{id}:
 *   get:
 *     tags:
 *       - Organisations
 *     summary: Get a single organisation by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Organisation details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Organisation'
 *       404:
 *         $ref: '#/components/schemas/ErrorMessage'
 */
router.get(
  "/:id",
  validate(organisationIdParamSchema),
  OrganisationController.getById,
);

// Administrative routes require authentication and super-admin
router.use(authenticate, requireSuperAdmin);

/**
 * @swagger
 * /api/v1/organisations:
 *   post:
 *     tags:
 *       - Organisations
 *     summary: Create a new organisation (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CsrfHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrganisationRequest'
 *     responses:
 *       201:
 *         description: Organisation created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Organisation'
 */
router.post(
  "/",
  validate(createOrganisationSchema),
  OrganisationController.create,
);

/**
 * @swagger
 * /api/v1/organisations/{id}:
 *   patch:
 *     tags:
 *       - Organisations
 *     summary: Update an existing organisation (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrganisationRequest'
 *     responses:
 *       200:
 *         description: Organisation updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Organisation'
 */
router.patch(
  "/:id",
  validate(updateOrganisationSchema),
  OrganisationController.update,
);

/**
 * @swagger
 * /api/v1/organisations/{id}:
 *   delete:
 *     tags:
 *       - Organisations
 *     summary: Delete an organisation (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Organisation deleted
 */
router.delete(
  "/:id",
  validate(organisationIdParamSchema),
  OrganisationController.delete,
);

export default router;
