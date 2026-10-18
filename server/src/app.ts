import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import entryRoutes from "./routes/entryRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

export function createApp(): Express {
  const app = express();

  // Security headers & CORS
  app.use(helmet());
  app.use(
    cors({
      origin: [config.corsOrigin, "http://localhost:5173", "http://localhost:3000"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    })
  );

  // Request parsing with bounded payload size to mitigate memory exhaustion
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Observability & Request Tracing Middleware
  app.use(requestLogger);

  // Health probe endpoint for Container Orchestrators (K8s / Docker / Cloud Run)
  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
      environment: config.nodeEnv,
    });
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/entries", entryRoutes);
  app.use("/api/analytics", analyticsRoutes);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
