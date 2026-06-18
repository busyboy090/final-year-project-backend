import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redis from '../config/redis.ts';
import type { Request, Response } from 'express';

/**
 * Factory function to create tailored rate limiters using Redis.
 * This keeps the limits stateless and consistent across server restarts.
 */
const createLimiter = (windowMs: number, max: number, defaultMessage: string, keyPrefix: string) => {
  return rateLimit({
    ...(process.env.NODE_ENV === "test"
      ? {}
      : {
          store: new RedisStore({
            // @ts-ignore
            sendCommand: (...args: string[]) => redis.call(...args) as Promise<any>,
            prefix: `rl:${keyPrefix}:`,
          }),
        }),
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,

    validate: {
      default: true,
      keyGeneratorIpFallback: false,
    },

    // --- DYNAMIC MESSAGE LOGIC ---
    handler: (req: Request, res: Response) => {
      // req.rateLimit.resetTime is a Date object provided by the middleware
      const resetTime = (req as any).rateLimit.resetTime;
      const now = new Date();
      
      // Calculate difference in minutes, rounding up
      const diffMs = resetTime.getTime() - now.getTime();
      const diffMins = Math.ceil(diffMs / (1000 * 60));
      const diffSecs = Math.ceil(diffMs / 1000);

      let dynamicMessage = defaultMessage;

      // Replace "30 minutes" or similar placeholders with the actual remaining time
      if (diffMins > 1) {
        dynamicMessage = `Too many requests. Please try again in ${diffMins} minutes.`;
      } else {
        dynamicMessage = `Too many requests. Please try again in ${diffSecs} seconds.`;
      }

      res.status(429).json({
        success: false,
        status: 429,
        error: "Too Many Requests",
        message: dynamicMessage,
        retryAfterMins: diffMins,
        retryAfterSecs: diffSecs // Useful for the frontend ResendOTP component!
      });
    },

    keyGenerator: (req: Request): string => {
      const ip = req.ip || 'unknown-ip';
      const email = req.body?.email;
      return email ? `${ip}_${email}` : ip;
    },

    skip: (req: Request) => req.path === '/health',
  });
};

/* --- Exported Limiters --- */

/**
 * General API Limiter
 * 100 requests per 15-minute window.
 */
export const apiLimiter = createLimiter(
  15 * 60 * 1000,
  100,
  "You have exceeded the request limit. Please try again after 15 minutes.",
  "global"
);

/**
 * OTP / Resend Limiter
 * 3 requests per 30 minutes.
 */
export const otpLimiter = createLimiter(
  30 * 60 * 1000,
  3,
  "You can only request a new code 3 times every 30 minutes.",
  "otp"
);

/**
 * Auth Limiter 
 * Returns a configured middleware instance.
 */
export const authLimiter = (routeLabel: string, maxAttempts: number = 5, windowMin: number = 10) => {
  return createLimiter(
    windowMin * 60 * 1000,
    maxAttempts,
    `Too many attempts for ${routeLabel}. Please try again in ${windowMin} minutes.`,
    "auth/" + routeLabel
  );
};

/**
 * Custom Limiter
 * Fully flexible for unique route requirements.
 */
export const customLimiter = (windowMs: number, max: number, message: string, keyPrefix: string) => {
  return createLimiter(
    windowMs,
    max,
    message,
    keyPrefix
  );
};
