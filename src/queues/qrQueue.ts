import Queue from "bull";
import env from "../config/env.ts";

const redisUrl = env.UPSTASH_REDIS_URL;

const qrQueue =
  env.NODE_ENV === "test"
    ? {
        add: async () => null,
        process: () => undefined,
        on: () => undefined,
      }
    : new Queue("qrQueue", redisUrl, {
        redis: {
          // Upstash requires TLS — without this, connections were failing
          // silently and Bull would sit retrying with its default
          // (effectively unbounded) ioredis retry behavior.
          tls: {},
          maxRetriesPerRequest: Number(env.REDIS_MAX_RETRIES) || 3,
        },
      });

export default qrQueue;