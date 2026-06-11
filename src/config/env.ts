import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  NAME: string;
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  DB_NAME: string;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_PORT: number;
  DB_HOST: string;
  DB_DIALECT: string;
  DB_URL: string;
  ALLOWED_ORIGINS: string;
  REFRESH_TOKEN_SECRET: string;
  ACCESS_TOKEN_SECRET: string;
  TEMP_TOKEN_SECRET: string;
  COOKIE_SECRET: string;
  EMAIL_TOKEN_SECRET: string;
  UPSTASH_REDIS_URL: string;
  REDIS_MAX_RETRIES: number;
  RESEND_API_KEY: string;
  DOMAIN: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  FRONTEND_URL?: string;
  EVENT_TOKEN_SCERET?: string;
}

const env: EnvConfig = {
  NAME: process.env.NAME || "",
  NODE_ENV: (process.env.NODE_ENV as EnvConfig["NODE_ENV"]) || "development",
  PORT: Number(process.env.PORT) || 3000,
  DB_NAME: process.env.DB_NAME || "",
  DB_USERNAME: process.env.DB_USERNAME || "",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: Number(process.env.DB_PORT) || 5432,
  DB_DIALECT: process.env.DB_DIALECT || "postgres",
  DB_URL: process.env.DB_URL || "",
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "*",
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || "",
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || "",
  TEMP_TOKEN_SECRET: process.env.TEMP_TOKEN_SECRET || "",
  COOKIE_SECRET: process.env.COOKIE_SECRET || "",
  EMAIL_TOKEN_SECRET: process.env.EMAIL_TOKEN_SECRET || "",
  UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL || "",
  REDIS_MAX_RETRIES: Number(process.env.REDIS_MAX_RETRIES) || 1,
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  DOMAIN: process.env.DOMAIN || "",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  FRONTEND_URL: process.env.FRONTEND_URL || "",
  EVENT_TOKEN_SCERET: process.env.EVENT_TOKEN_SCERET || "",
};

// Logic check: Ensure critical DB and Secret variables exist in production
if (env.NODE_ENV === "production") {
  const required = ["DB_NAME", "DB_PASSWORD", "ACCESS_TOKEN_SECRET", "COOKIE_SECRET"];
  required.forEach((key) => {
    if (!env[key as keyof EnvConfig]) {
      throw new Error(`❌ Missing required environment variable: ${key}`);
    }
  });
}

export default env;