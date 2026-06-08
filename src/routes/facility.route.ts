import { Router } from "express";
import { FacilityController } from "../controllers/facility.controller.ts";
import { createFacilitySchema, updateFacilitySchema } from "../validators/facility.schema.ts";
import { validate } from "../middlewares/validate.ts";
import { authenticate } from "../middlewares/auth.ts";
import { hasRole } from "../middlewares/role.ts";

const router: Router = Router();

// Secure all endpoints with authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/facilities
 * @desc    Retrieve all available facilities in the ADUN registry with pagination & search
 */
router.get("/", FacilityController.getAllFacilities);

/**
 * @route   GET /api/v1/facilities/:id
 * @desc    Fetch a specific facility asset by its ID
 */
router.get("/:id", FacilityController.getFacilityById);

/**
 * @route   POST /api/v1/facilities
 * @desc    Create a new university facility asset
 */
router.post(
  "/", 
  hasRole(["super-admin"]), 
  validate(createFacilitySchema), 
  FacilityController.createFacility
);

/**
 * @route   PATCH /api/v1/facilities/:id
 * @desc    Update an existing facility's parameters
 */
router.patch(
  "/:id", 
  hasRole(["super-admin"]), 
  validate(updateFacilitySchema), 
  FacilityController.updateFacility
);

/**
 * @route   DELETE /api/v1/facilities/:id
 * @desc    Delete a facility asset from the registry
 */
router.delete(
  "/:id",
  hasRole(["super-admin"]),
  FacilityController.deleteFacility
);

export default router;