import csurf from "csurf";
import type { RequestHandler } from "express";
import config from "./env.ts";

/**
 * CSRF Protection Middleware
 * Note: 'csurf' requires cookie-parser middleware to be initialized with a secret first.
 */
const csrfProtection: RequestHandler = csurf({
  cookie: {
    // Ensures the cookie is only sent over HTTPS in production
    secure: config.NODE_ENV === "production",

    // 'none' requires 'secure: true'. 
    // In dev, 'strict' prevents the cookie from being sent in cross-site contexts.
    sameSite: config.NODE_ENV === "production" ? "none" : "strict",

    // Prevents client-side scripts from accessing the cookie
    httpOnly: true,

    // Ensures the cookie is verified against a secret
    signed: true,

    // Scope the cookie to the entire domain
    path: "/",
  },
});

export default csrfProtection;