import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redis from '../configs/redis.ts';
import type { Request } from 'express';

/**
 * Factory function to create tailored rate limiters using Redis.
 * This keeps the limits stateless and consistent across server restarts.
 */
const createLimiter = (windowMs: number, max: number, message: string, keyPrefix: string) => {
  return rateLimit({
    store: new RedisStore({
      // @ts-ignore - Handles type mismatch between ioredis and rate-limit-redis
      sendCommand: (...args: string[]) => redis.call(...args) as Promise<any>,
      prefix: `rl:${keyPrefix}:`, // Segregate limits in Redis by route
    }),
    windowMs,
    max,
    standardHeaders: true, // Returns RateLimit-Limit, RateLimit-Remaining, and RateLimit-Reset headers
    legacyHeaders: false,   // Disables X-RateLimit-* headers

    // --- FIX FOR ERR_ERL_KEY_GEN_IPV6 ---
    validate: {
      default: true,
      keyGeneratorIpFallback: false,
    },

    message: {
      success: false,
      status: 429,
      error: "Too Many Requests",
      message
    },

    /**
     * Identifies users by IP by default.
     * Couples IP + Email for auth routes to prevent targeted brute-force.
     */
    keyGenerator: (req: Request): string => {
      const ip = req.ip || 'unknown-ip';
      const email = req.body?.email;

      return email ? `${ip}_${email}` : ip;
    },

    // Prevent the health check route from consuming the rate limit quota
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