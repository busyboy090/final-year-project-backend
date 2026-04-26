// External Modules
import { Router } from "express";
import type { Request, Response } from "express";

// Local Modules
import AuthRoutes from "./auth.ts";

const router: Router  = Router();

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
router.get('/csrf-token', (req: Request, res: Response) => {
    res.status(200).json({ csrfToken: req.csrfToken() })
});

// Auth Routes
router.use('/auth', AuthRoutes)

export default router;