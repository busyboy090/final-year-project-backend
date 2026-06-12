import { type Request } from "express";
import { type CorsOptions } from "cors";
import config from "./env.ts";
import AppError from "../utils/appError.ts";

// Allowed Headers & Methods
const allowedHeaders: string[] = [
  "Authorization",
  "X-CSRF-TOKEN",
  "Content-Type",
  "X-API-KEY",
  "X-TEMP-TOKEN",
  "X-Requested-With",
  "Origin",
  "Accept",
  "X-Idempotency-Key",
];

const allowedMethods: string[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
];

// Whitelist Logic
const developmentOrigins: string[] = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4000",
];
const baseOrigins: string[] = (config.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Include API_ORIGIN and frontend origin aliases from env
const additionalOrigins: string[] = [
  config.API_ORIGIN,
  config.FRONTEND_ORIGIN,
  config.FRONTEND_URL,
]
  .filter(Boolean)
  .map((o) => (o as string).trim());

// Combine and dedupe
const combinedBaseOrigins: string[] = Array.from(
  new Set([...baseOrigins, ...additionalOrigins]),
);

const allowAllOrigins: boolean =
  combinedBaseOrigins.includes("*") ||
  (config.ALLOWED_ORIGINS || "").trim() === "*";

const finalWhitelist: string[] =
  config.NODE_ENV === "development"
    ? [...combinedBaseOrigins, ...developmentOrigins]
    : [...combinedBaseOrigins];

// Endpoints that bypass strict origin checks (no-origin / browser-direct requests)
const allowedSelectedEndpoints: string[] = [
  "/health",
  "/api-docs",
  "/api/v1/oauth/google",
  "/api/v1/oauth/github",
  "/api/v1/oauth/google/callback",
  "/api/v1/oauth/facebook",
  "/api/v1/oauth/facebook/callback",
  "/api/v1/oauth/github/callback",
  "/api/v1/payments",
  "/webhook",
];

/**
 * Check if origin is allowed
 */
const isOriginAllowed = (origin: string | undefined, req: Request): boolean => {
  // 0. Wildcard — allow all origins
  if (allowAllOrigins) return true;

  // 1. Origin is explicitly whitelisted
  if (origin && finalWhitelist.includes(origin)) return true;

  // 2. Same-origin requests from the API server itself (Scalar "Try it" calls
  //    fired from the docs page arrive with the API's own origin)
  const apiBaseUrl = config.API_ORIGIN;
  if (origin && apiBaseUrl && origin === apiBaseUrl.replace(/\/$/, "")) {
    return true;
  }

  // 3. No origin in development — allow (non-browser tools, curl, etc.)
  if (!origin && config.NODE_ENV !== "production") return true;

  // 4. No origin but request is to a public endpoint — allow in all envs.
  //    This covers Scalar's internal spec fetch (/api-docs/openapi.json) and
  //    any server-side or tool-based requests to the listed paths.
  if (
    !origin &&
    req &&
    allowedSelectedEndpoints.some((path) => req.url.startsWith(path))
  ) {
    return true;
  }

  return false;
};

/**
 * CORS options delegate
 */
const corsOptionsDelegate = (
  req: Request,
  callback: (err: Error | null, options?: CorsOptions) => void,
) => {
  const origin = req.header("Origin");

  if (isOriginAllowed(origin, req)) {
    callback(null, {
      origin: true, // Reflect the request origin
      methods: allowedMethods,
      credentials: true,
      allowedHeaders,
    });
  } else {
    callback(
      new AppError({
        status: "error",
        message: `CORS blocked: Origin ${origin || "Unknown"} not authorized for this path.`,
        statusCode: 403,
      }),
    );
  }
};

export default corsOptionsDelegate;