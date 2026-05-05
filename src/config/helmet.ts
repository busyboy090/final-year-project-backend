import { type HelmetOptions } from "helmet";

/**
 * Custom Helmet configuration for Express.js
 * Provides protection against XSS, Clickjacking, and other web vulnerabilities.
 */
const helmetOptions: HelmetOptions = {
  contentSecurityPolicy: {
    directives: {
      // Default to only allowing content from our own domain
      defaultSrc: ["'self'"],
      
      // Scripts: Only allow from our own domain
      scriptSrc: ["'self'"],
      
      // Styles: Allow self and Google Fonts
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      
      // Fonts: Allow self and Google Fonts CDN
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      
      // Images: Allow self and data URIs (base64)
      imgSrc: ["'self'", "data:"],
      
      // Connections: Restrict where the app can send data (APIs, WebSockets)
      connectSrc: ["'self'"],
      
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
  
  // Security policies for cross-origin isolation
  crossOriginEmbedderPolicy: true,
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
    preload: true 
  },
};

export default helmetOptions;