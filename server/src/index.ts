import { createApp } from "./app.js";
import { config } from "./config/env.js";
import { db } from "./db/index.js";

async function bootstrap() {
  try {
    // Initialize database connection pool & schema
    await db.init();

    const app = createApp();
    const server = app.listen(config.port, () => {
      console.log(`=======================================================`);
      console.log(` [VAULT API] Emotion Health Server running on port ${config.port}`);
      console.log(` [MODE]      ${config.nodeEnv.toUpperCase()}`);
      console.log(` [HEALTH]    http://localhost:${config.port}/health`);
      console.log(`=======================================================`);
    });

    // Graceful Shutdown handling for container lifecycle signals
    const shutdown = async (signal: string) => {
      console.log(`\n[SYSTEM] Received ${signal}. Initiating graceful shutdown...`);
      server.close(() => {
        console.log("[SYSTEM] HTTP server terminated.");
        process.exit(0);
      });

      // Force terminate if graceful shutdown hangs
      setTimeout(() => {
        console.error("[SYSTEM] Forcing shutdown after timeout.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    console.error("[SYSTEM] Fatal error during bootstrap:", err);
    process.exit(1);
  }
}

bootstrap();
