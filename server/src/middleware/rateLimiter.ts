import { Request, Response, NextFunction } from "express";
import { cache } from "../db/redis.js";
import { config } from "../config/env.js";

export function createRateLimiter(options?: { maxRequests?: number; windowSeconds?: number }) {
  const max = options?.maxRequests || config.rateLimit.maxRequests;
  const windowSec = options?.windowSeconds || Math.ceil(config.rateLimit.windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "anonymous";
      const key = `ratelimit:${clientIp}`;

      const { count, ttl } = await cache.incrementRateLimit(key, windowSec);

      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - count));
      res.setHeader("X-RateLimit-Reset", ttl);

      if (count > max) {
        res.status(429).json({
          error: "Too Many Requests",
          message: `Rate limit of ${max} requests per ${windowSec}s exceeded. Please retry in ${ttl} seconds.`,
          retryAfter: ttl,
        });
        return;
      }

      next();
    } catch (err) {
      // In fail-open systems architecture, if the rate limiter throws an unexpected error, we log and allow the request through.
      console.error("[RateLimiter] Error evaluating token bucket:", err);
      next();
    }
  };
}
