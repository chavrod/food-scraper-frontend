import { Redis } from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
});

// Error handling for Redis connection-level errors
redis.on("error", (err) => {
  console.log("Redis error:", err);
});

export default redis;
