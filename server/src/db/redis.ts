import Redis from "ioredis";
import { config } from "../config/env.js";

export interface ICacheClient {
  isAvailable(): boolean;
  incrementRateLimit(key: string, windowSeconds: number): Promise<{ count: number; ttl: number }>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Redis Implementation (Atomic sliding-window using Redis MULTI/pipeline)
// ---------------------------------------------------------------------------
class RedisCache implements ICacheClient {
  private client: Redis;

  constructor(url: string) {
    this.client = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    this.client.on("connect", () => console.log("[Redis] Connected to cluster/instance."));
    this.client.on("error", (err) => console.warn("[Redis] Cache connection error:", err.message));
  }

  isAvailable(): boolean {
    return this.client.status === "ready";
  }

  async incrementRateLimit(key: string, windowSeconds: number): Promise<{ count: number; ttl: number }> {
    const multi = this.client.multi();
    multi.incr(key);
    multi.ttl(key);
    const results = await multi.exec();

    if (!results) return { count: 1, ttl: windowSeconds };

    const count = (results[0][1] as number) || 1;
    let ttl = (results[1][1] as number) || -1;

    // Set TTL on the first hit
    if (ttl === -1) {
      await this.client.expire(key, windowSeconds);
      ttl = windowSeconds;
    }

    return { count, ttl };
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, "EX", ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}

// ---------------------------------------------------------------------------
// In-Memory Sliding Window Fallback (Zero external dependency mode)
// ---------------------------------------------------------------------------
class InMemoryCache implements ICacheClient {
  private store: Map<string, { value: string; expiresAt: number }> = new Map();
  private rateLimits: Map<string, { count: number; resetAt: number }> = new Map();

  isAvailable(): boolean {
    return true;
  }

  async incrementRateLimit(key: string, windowSeconds: number): Promise<{ count: number; ttl: number }> {
    const now = Date.now();
    const existing = this.rateLimits.get(key);

    if (!existing || now > existing.resetAt) {
      const resetAt = now + windowSeconds * 1000;
      this.rateLimits.set(key, { count: 1, resetAt });
      return { count: 1, ttl: windowSeconds };
    }

    existing.count += 1;
    const ttl = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { count: existing.count, ttl };
  }

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds = 300): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export const cache: ICacheClient = config.redisUrl
  ? new RedisCache(config.redisUrl)
  : new InMemoryCache();
