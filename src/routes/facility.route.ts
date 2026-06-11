import { Router } from "express";
import { FacilityController } from "../controllers/facility.controller.ts";
import {
  createFacilitySchema,
  updateFacilitySchema,
} from "../validators/facility.schema.ts";
import { validate } from "../middlewares/validate.ts";
import { authenticate } from "../middlewares/auth.ts";
import { hasRole } from "../middlewares/role.ts";

const router: Router = Router();

// Secure all endpoints with authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/facilities:
 *   get:
 *     tags:
 *       - Facilities
 *     summary: Retrieve all facilities (requires auth)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of facilities
 */
router.get("/", FacilityController.getAllFacilities);

/**
 * @swagger
 * /api/v1/facilities/{id}:
 *   get:
 *     tags:
 *       - Facilities
 *     summary: Get facility by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Facility details
 */
router.get("/:id", FacilityController.getFacilityById);

/**
 * @swagger
 * /api/v1/facilities:
 *   post:
 *     tags:
 *       - Facilities
 *     summary: Create a facility (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 */
router.post(
  "/",
  hasRole(["super-admin"]),
  validate(createFacilitySchema),
  FacilityController.createFacility,
);

/**
 * @swagger
 * /api/v1/facilities/{id}:
 *   patch:
 *     tags:
 *       - Facilities
 *     summary: Update a facility (admin)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 */
router.patch(
  "/:id",
  hasRole(["super-admin"]),
  validate(updateFacilitySchema),
  FacilityController.updateFacility,
);

/**
 * @swagger
 * /api/v1/facilities/{id}:
 *   delete:
 *     tags:
 *       - Facilities
 *     summary: Delete a facility (admin)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/:id",
  hasRole(["super-admin"]),
  FacilityController.deleteFacility,
);

export default router;
