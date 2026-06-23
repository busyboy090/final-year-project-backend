// External Modules
import { Router } from "express";
import type { Request, Response } from "express";

// Local Modules
import AuthRoutes from "./auth.route.ts";
import AdminRoutes from "./admin.route.ts";
import UserRoutes from "./user.route.ts";
import LevelRoutes from "./level.route.ts";
import DepartmentRoutes from "./department.route.ts";
import VenueRoutes from "./venue.route.ts";
import EventRoutes from "./event/event.route.ts";
import FacultyRoutes from "./faculty.route.ts";
import FacilityRoutes from "./facility.route.ts";
import OrganisationRoutes from "./organisation.route.ts";
import AcademicSessionRoutes from "./academic-session.route.ts";

const router: Router = Router();

// Routes
/**
 * @swagger
 * /api/csrf-token:
 *   get:
 *     tags:
 *       - Security
 *     summary: Get CSRF token
 *     description: Returns a CSRF token that clients must send in the `x-csrf-token` header on POST/PUT/PATCH/DELETE under `/api`. Requires cookies (session + signed CSRF cookie).
 *     responses:
 *       200:
 *         description: CSRF token generated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 csrfToken:
 *                   type: string
 *                   example: 7f4c0d0f-9ef7-4b5f-8f55-3fd9f5f5521a
 *       500:
 *         description: Failed to generate CSRF token.
 */
router.get("/csrf-token", (req: Request, res: Response) => {
  res.status(200).json({ csrfToken: req.csrfToken() });
});

// Auth Routes
router.use("/v1/auth", AuthRoutes);

// Admin Routes
router.use("/v1/admin", AdminRoutes);

// User Routes
router.use("/v1/user", UserRoutes);

// Levels Routes
router.use("/v1/levels", LevelRoutes);

// Academic Sessions Routes
router.use("/v1/academic-sessions", AcademicSessionRoutes);

// Departments Routes
router.use("/v1/departments", DepartmentRoutes);

// Venue Routes
router.use("/v1/venues", VenueRoutes);

// Event Routes
router.use("/v1/events", EventRoutes);

// Faculty Routes
router.use("/v1/faculties", FacultyRoutes);

// Facility Routes
router.use("/v1/facilities", FacilityRoutes);

// Organisation Routes
router.use("/v1/organisations", OrganisationRoutes);

export default router;
