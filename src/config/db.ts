// Local Modules
import env from "./env.ts";

export default {
  "development": {
    "username": env.DB_USERNAME || "postgres",
    "password": env.DB_PASSWORD || null,
    "port": env.DB_PORT || null,
    "database": env.DB_NAME || "database_dev",
    "host": env.DB_HOST || "127.0.0.1",
    "dialect": (env.DB_DIALECT as any) || "postgres",
  },
  "test": {
    "url": env.DB_URL,
    "dialect": (env.DB_DIALECT as any) || "postgres",
    "dialectOptions": {
      "ssl": {
        "require": true,
        "rejectUnauthorized": false,
      },
    },
  },
  "production": {
    "username": env.DB_USERNAME,
    "password": env.DB_PASSWORD,
    "port": env.DB_PORT,
    "database": env.DB_NAME,
    "host": env.DB_HOST,
    "dialect": (env.DB_DIALECT as any),
    "logging": false,
    "dialectOptions": {
      "ssl": {
        "require": true,
        "rejectUnauthorized": false
      }
    }
  }
};