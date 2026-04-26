// Local Modules
import env from "./env.ts";

export default {
  "development": {
    "username": env.DB_USERNAME || "postgres",
    "password": env.DB_PASSWORD || null,
    "database": env.DB_NAME || "database_dev",
    "host": env.DB_HOST || "127.0.0.1",
    "dialect": (process.env.DB_DIALECT as any) || "postgres",
  },
  "test": {
    "username": env.DB_USERNAME || "postgres",
    "password": env.DB_PASSWORD || null,
    "database": env.DB_NAME || "database_test",
    "host": env.DB_HOST || "127.0.0.1",
    "dialect": (env.DB_DIALECT as any) || "postgres",
  },
  "production": {
    "username": env.DB_USERNAME,
    "password": env.DB_PASSWORD,
    "database": env.DB_NAME,
    "host": env.DB_HOST,
    "dialect": (env.DB_DIALECT as any) || "postgres",
    "logging": false,
    "dialectOptions": {
      "ssl": {
        "require": true,
        "rejectUnauthorized": false
      }
    }
  }
};