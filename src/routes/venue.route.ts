import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { VenueController } from "../controllers/venue.controller.ts";
import { authenticate } from "../middlewares/auth.ts";
import { requireSuperAdmin } from "../middlewares/role.ts";
import { upload } from "../config/multer.ts";
import { validate } from "../middlewares/validate.ts";
import {
  createVenueSchema,
  updateVenueSchema,
} from "../validators/venue.schema.ts";

const router: Router = Router();

const normalizeVenueBody = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.body.features && req.body["features[]"]) {
    req.body.features = req.body["features[]"];
  }
  next();
};

/**
 * @swagger
 * /api/v1/venues:
 *   get:
 *     tags:
 *       - Venues
 *     summary: List venues
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of venues
 */
// Public Discovery
router.get("/", authenticate, VenueController.getAllVenues);

/**
 * @swagger
 * /api/v1/venues/{id}:
 *   get:
 *     tags:
 *       - Venues
 *     summary: Get a single venue
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Venue details
 *       404:
 *         $ref: '#/components/schemas/ErrorMessage'
 */
router.get("/:id", authenticate, VenueController.getVenue);

/**
 * @swagger
 * /api/v1/venues:
 *   post:
 *     tags:
 *       - Venues
 *     summary: Create a venue
 *     parameters:
 *       - $ref: '#/components/parameters/CsrfHeader'
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               thumbnail:
 *                 type: string
 *                 format: binary
 */
// Administrative Updates
router.post(
  "/",
  authenticate,
  requireSuperAdmin,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  normalizeVenueBody,
  validate(createVenueSchema),
  VenueController.createVenue,
);

/**
 * @swagger
 * /api/v1/venues/{id}:
 *   put:
 *     tags:
 *       - Venues
 *     summary: Update a venue
 *     parameters:
 *       - $ref: '#/components/parameters/CsrfHeader'
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 */
router.put(
  "/:id",
  authenticate,
  requireSuperAdmin,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  normalizeVenueBody,
  validate(updateVenueSchema),
  VenueController.updateVenue,
);

export default router;
