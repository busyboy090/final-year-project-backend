// routes/department.routes.ts
import { Router } from "express";
import { DepartmentController } from "../controllers/department.controller.ts";
import { authenticate } from "../middlewares/auth.ts";
import { requireSuperAdmin } from "../middlewares/role.ts";
import { validate } from "../middlewares/validate.ts";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  getDepartmentByIdSchema,
  deleteDepartmentSchema,
  getAllDepartmentsSchema,
} from "../validators/department.schema.ts";

const router: Router = Router();

/**
 * @swagger
 * /api/v1/departments:
 *   get:
 *     tags:
 *       - Organisations
 *     summary: List departments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of departments
 */
router.get(
  "/",
  authenticate,
  validate(getAllDepartmentsSchema),
  DepartmentController.getAllDepartments,
);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   get:
 *     tags:
 *       - Organisations
 *     summary: Get department by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: Department details
 */
router.get(
  "/:id",
  authenticate,
  validate(getDepartmentByIdSchema),
  DepartmentController.getDepartmentById,
);

/**
 * @swagger
 * /api/v1/departments:
 *   post:
 *     tags:
 *       - Organisations
 *     summary: Create department (admin)
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/",
  authenticate,
  requireSuperAdmin,
  validate(createDepartmentSchema),
  DepartmentController.createDepartment,
);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   patch:
 *     tags:
 *       - Organisations
 *     summary: Update department (admin)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 */
router.patch(
  "/:id",
  authenticate,
  requireSuperAdmin,
  validate(updateDepartmentSchema),
  DepartmentController.updateDepartment,
);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   delete:
 *     tags:
 *       - Organisations
 *     summary: Delete department (admin)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 */
router.delete(
  "/:id",
  authenticate,
  requireSuperAdmin,
  validate(deleteDepartmentSchema),
  DepartmentController.deleteDepartment,
);

export default router;
