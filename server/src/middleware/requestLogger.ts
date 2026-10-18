import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const correlationId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
  req.headers["x-request-id"] = correlationId;
  res.setHeader("X-Request-Id", correlationId);

  const startTime = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(startTime);
    const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    const status = res.statusCode;
    const level = status >= 500 ? "ERROR" : status >= 400 ? "WARN" : "INFO";

    console.log(
      JSON.stringify({
        level,
        timestamp: new Date().toISOString(),
        correlationId,
        method: req.method,
        path: req.originalUrl || req.url,
        status,
        durationMs: `${durationMs}ms`,
        ip: req.ip || req.socket.remoteAddress,
      })
    );
  });

  next();
}
