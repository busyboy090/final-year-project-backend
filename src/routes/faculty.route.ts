import { Router } from "express";
import { FacultyController } from "../controllers/faculty.controller.ts";
import { authenticate } from "../middlewares/auth.ts";
import { requireSuperAdmin } from "../middlewares/role.ts";
import { validate } from "../middlewares/validate.ts";
import {
  createFacultySchema,
  updateFacultySchema,
  facultyParamsSchema,
} from "../validators/faculty.schema.ts";

const router: Router = Router();

/**
 * @swagger
 * /api/v1/faculties:
 *   get:
 *     tags:
 *       - Organisations
 *     summary: Get all faculties
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of faculties
 */
router.get("/", authenticate, FacultyController.getAllFaculties);

/**
 * @swagger
 * /api/v1/faculties/{id}:
 *   get:
 *     tags:
 *       - Organisations
 *     summary: Get faculty by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Faculty details
 */
router.get(
  "/:id",
  authenticate,
  validate(facultyParamsSchema),
  FacultyController.getFacultyById,
);

/**
 * @swagger
 * /api/v1/faculties:
 *   post:
 *     tags:
 *       - Organisations
 *     summary: Create faculty (admin)
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/",
  authenticate,
  requireSuperAdmin,
  validate(createFacultySchema),
  FacultyController.createFaculty,
);

/**
 * @swagger
 * /api/v1/faculties/{id}:
 *   patch:
 *     tags:
 *       - Organisations
 *     summary: Update faculty (admin)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 */
router.patch(
  "/:id",
  authenticate,
  requireSuperAdmin,
  validate(updateFacultySchema),
  FacultyController.updateFaculty,
);

/**
 * @swagger
 * /api/v1/faculties/{id}:
 *   delete:
 *     tags:
 *       - Organisations
 *     summary: Delete a faculty (admin)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 */
router.delete(
  "/:id",
  authenticate,
  requireSuperAdmin,
  validate(facultyParamsSchema),
  FacultyController.deleteFaculty,
);

export default router;
