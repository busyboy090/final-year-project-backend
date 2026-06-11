// External Modules
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

// Local Modules
import env from "./config/env.ts";
import corsOptions from "./config/cors.ts";
import helmetOptions from "./config/helmet.ts";
import csrfProtection from "./config/csrf.ts";
import swaggerSpec from "./config/swagger.ts";
import { apiLimiter } from "./middlewares/ratelimiter.ts";

// Types
import type { Request, Response, Application } from "express";

// Routes
import routes from "./routes/index.route.ts";

const app: Application = express();
const PORT = env.PORT;

app.set("trust proxy", 1);
// Global Security & Optimization
app.use(helmet(helmetOptions));
app.use(cors(corsOptions));
app.use(compression());

// Body & Cookie Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(env.COOKIE_SECRET));

// Public/Utility Routes (Before CSRF)
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

app.get("/api-docs", (_req, res: Response) => {
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "font-src 'self' data: https://cdn.jsdelivr.net",
      "img-src 'self' data: https://cdn.jsdelivr.net",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  );

  res.status(200).type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ADUN-EMS API Reference</title>
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
    <script>
      Scalar.createApiReference('#app', {
        url: '/api-docs/openapi.json'
      });
    </script>
  </body>
</html>`);
});

// Apply CSRF Protection (Only for API routes)
app.use(csrfProtection);

// API Routes
app.use("/api/v1", apiLimiter, routes);

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
    console.error(err);

    // Specific Handle for CSRF Errors
    if (err.code === "EBADCSRFTOKEN") {
      return res.status(403).json({
        status: "fail",
        message:
          "Invalid or missing CSRF token. Please ensure your headers include 'x-csrf-token'.",
      });
    }

    // Handle Zod/Validation Errors if they bubble up
    if (err.name === "ZodError" || err.status === 400) {
      return res.status(400).json({
        status: "fail",
        message: err.message,
        errors: err.issues || err.errors,
      });
    }

    const statusCode = err?.statusCode || err?.status || 500;
    const message = statusCode === 500 ? "Internal server error" : err?.message;
    const status = err?.status || "error";

    if (!res.headersSent) {
      res.status(statusCode).json({
        status,
        message,
        ...(err?.reason && { reason: err.reason }),
        // Only show stack trace in development mode for easier debugging
        ...(env.NODE_ENV === "development" && { stack: err.stack }),
      });
    }
  } catch (fatalErr) {
    console.error("Fatal error in error middleware:", fatalErr);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ status: "error", message: "Internal server error" });
    }
  }
});

app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
