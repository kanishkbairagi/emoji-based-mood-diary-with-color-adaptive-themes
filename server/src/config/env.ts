import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production-vault-key-32b",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  databaseUrl: process.env.DATABASE_URL || "",
  redisUrl: process.env.REDIS_URL || "",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute window
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || "100", 10), // 100 requests per minute
  },
};
