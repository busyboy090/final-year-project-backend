// External Modules
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { apiReference } from "@scalar/express-api-reference";

// Local Modules
import env from "./config/env.ts";
import corsOptions from "./config/cors.ts";
import helmetOptions from "./config/helmet.ts";
import csrfProtection from "./config/csrf.ts";
import swaggerSpec from "./config/swagger.ts";
import { apiLimiter } from "./middlewares/ratelimiter.ts";
import routes from "./routes/index.route.ts";

// Types
import type { Request, Response, Application } from "express";

const app: Application = express();

app.set("trust proxy", 1);

// Global Security & Optimization
app.use(helmet(helmetOptions));
app.use(cors(corsOptions));
app.use(compression());

// Body & Cookie Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(env.COOKIE_SECRET));

/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check
 *     description: Liveness probe; not protected by CSRF or API rate limits on this path.
 *     responses:
 *       200:
 *         description: Server is running.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 uptime:
 *                   type: number
 *                   description: Process uptime in seconds.
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get("/health", (_req, res: Response) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api-docs/openapi.json", (_req, res: Response) => {
  res.status(200).json(swaggerSpec);
});

app.get("/api-docs", apiReference({ url: "/api-docs/openapi.json" }));

// Apply CSRF Protection (Only for API routes)
app.use(csrfProtection);

// API Routes
app.use("/api", apiLimiter, routes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use(async (err: any, _req: any, res: Response, _next: any) => {
  try {
    env.NODE_ENV === "development" && console.error(err);

    if (err.code === "EBADCSRFTOKEN") {
      return res.status(403).json({
        status: "fail",
        message:
          "Invalid or missing CSRF token. Please ensure your headers include 'x-csrf-token'.",
      });
    }

    if (err.name === "ZodError" || err.status === 400) {
      return res.status(400).json({
        status: "fail",
        message: err.message,
        errors: err.issues || err.errors,
      });
    }

    const statusCode = err?.statusCode || err?.status || 500;
    const message =
      statusCode === 500 ? "Internal server error" : err?.message;
    const status = err?.status || "error";

    if (!res.headersSent) {
      res.status(statusCode).json({
        status,
        message,
        ...(err?.reason && { reason: err.reason }),
        ...(env.NODE_ENV === "development" && { stack: err.stack }),
      });
    }
  } catch (fatalErr) {
    console.error("Fatal error in error middleware:", fatalErr);
    if (!res.headersSent) {
      res.status(500).json({ status: "error", message: "Internal server error" });
    }
  }
});

export default app;
