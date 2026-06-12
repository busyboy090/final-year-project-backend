import { type HelmetOptions } from "helmet";
import env from "./env.ts";


/**
 * Custom Helmet configuration for Express.js
 * Provides protection against XSS, Clickjacking, and other web vulnerabilities.
 */
const helmetOptions: HelmetOptions = {
  contentSecurityPolicy: {
    directives: {
      // Default to only allowing content from our own domain
      defaultSrc: ["'self'"],

      // Scripts: Scalar requires inline scripts and unpkg/jsdelivr CDNs
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
      ],

      // Styles: Scalar uses heavy inline styling + Google Fonts
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net",
      ],

      // Fonts: Allow self, Google Fonts CDN, and Scalar's font domain
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net",
        "https://fonts.scalar.com",
      ],

      // Images: Allow self, data URIs, and cdn
      imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],

      // Connections: own API (so Scalar can make requests from the docs page) +
      // blob: and Scalar's own endpoints
      connectSrc: [
        "'self'",
        "blob:",
        "https://api.scalar.com",
        // Your Render URL — allows Scalar to call your API from the docs page
        env.API_ORIGIN ?? "http://localhost:3000",
      ].filter(Boolean) as string[],

      // Scalar uses a web worker internally — without this the UI silently breaks
      workerSrc: ["'self'", "blob:"],

      // Prevents the site from being embedded in frames on other sites
      frameAncestors: ["'none'"],

      // Automatically upgrade insecure requests to HTTPS
      upgradeInsecureRequests: [],
    },
  },

  // X-Frame-Options: Prevents Clickjacking
  frameguard: {
    action: "deny",
  },

  // crossOriginEmbedderPolicy must stay false — Scalar loads cross-origin
  // resources (fonts, scripts) that would otherwise be blocked by COEP
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },

  // Referrer-Policy: Do not send referrer headers to other sites
  referrerPolicy: { policy: "no-referrer" },

  // X-Content-Type-Options: Prevents MIME-type sniffing
  xContentTypeOptions: true,

  // DNS Prefetch Control: Disables DNS prefetching to protect user privacy
  dnsPrefetchControl: { allow: false },

  // HSTS: Forces HTTPS for 1 year (31,536,000 seconds)
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
};

export default helmetOptions;