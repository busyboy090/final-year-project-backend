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
    : new Queue("qrQueue", redisUrl);

export default qrQueue;
