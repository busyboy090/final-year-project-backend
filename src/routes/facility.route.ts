import { Router } from "express";
import { FacilityController } from "../controllers/facility.controller.ts";
import { createFacilitySchema, updateFacilitySchema } from "../validators/facility.schema.ts";
import { validate } from "../middlewares/validate.ts";
import { authenticate } from "../middlewares/auth.ts";
import { hasPermission, hasRole } from "../middlewares/role.ts";

const router: Router = Router();

router.use(authenticate)

/**
 * @route   GET /api/v1/facilities
 * @desc    Retrieve all available facilities in the ADUN registry
 * @access  Public/Private (depending on your auth middleware)
 */
router.get("/", FacilityController.list);

/**
 * @route   GET /api/v1/facilities/:id
 * @desc    Fetch a specific facility asset by its ID
 */
router.get("/:id", FacilityController.getById);

/**
 * @route   POST /api/v1/facilities
 * @desc    Create a new university facility asset
 */
router.post("/", hasPermission("manage-structure"), hasRole(["super-admin"]), validate(createFacilitySchema), FacilityController.create);

/**
 * @route   PATCH /api/v1/facilities/:id
 * @desc    Update an existing facility's name, icon, or description
 */
router.patch("/:id", hasPermission("manage-structure"), hasRole(["super-admin"]), validate(updateFacilitySchema), FacilityController.update);

export default router;