import Queue from "bull";
import env from "../config/env.ts";

const redisUrl = env.UPSTASH_REDIS_URL;

const qrQueue = new Queue("qrQueue", redisUrl);

export default qrQueue;
