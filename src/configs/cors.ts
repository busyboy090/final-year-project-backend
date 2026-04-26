import { type Request } from 'express';
import { type CorsOptions } from 'cors';
import config from './env.ts';
import AppError from '../utils/appError.ts';

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
    'X-Idempotency-Key'
];

const allowedMethods: string[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];

// Whitelist Logic
const developmentOrigins: string[] = ["http://localhost:5173", "http://localhost:5174", "http://localhost:4000"];
const baseOrigins: string[] = (config.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean);
const finalWhitelist: string[] = config.NODE_ENV === "development" ? [...baseOrigins, ...developmentOrigins] : [...baseOrigins];

// Specific endpoints allowed to bypass strict origin checks
const allowedSelectedEndpoints: string[] = [
    "/api/v1/oauth/google",
    "/api/v1/oauth/github",
    "/api/v1/oauth/google/callback",
    "/api/v1/oauth/facebook",
    "/api/v1/oauth/facebook/callback",
    "/api/v1/oauth/github/callback",
    "/api/v1/payments",
    "/webhook"
];

/**
 * Check if origin is allowed
 */
const isOriginAllowed = (origin: string | undefined, req: Request): boolean => {
    // 1. Allow if the origin is explicitly in our whitelist
    if (origin && finalWhitelist.includes(origin)) return true;

    // 2. Allow if there is no origin (Non-browser) and we aren't in production
    if (!origin && config.NODE_ENV !== "production") return true;

    // 3. Special Case: Allow specific endpoints even if no origin is present
    if (!origin && req && allowedSelectedEndpoints.some(path => req.url.includes(path))) {
        return true;
    }

    return false;
};

/**
 * CORS options function
 */
const corsOptionsDelegate = (
    req: Request, 
    callback: (err: Error | null, options?: CorsOptions) => void
) => {
    const origin = req.header('Origin');

    if (isOriginAllowed(origin, req)) {
        callback(null, {
            origin: true, // Reflect the request origin
            methods: allowedMethods,
            credentials: true,
            allowedHeaders
        });
    } else {
        callback(new AppError({
            status: "error",
            message: `CORS blocked: Origin ${origin || "Unknown"} not authorized for this path.`,
            statusCode: 403
        }));
    }
};

export default corsOptionsDelegate;