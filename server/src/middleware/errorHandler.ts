import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const correlationId = req.headers["x-request-id"] || "unknown";

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation Error",
      correlationId,
      issues: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  console.error(`[ErrorHandler] CorrelationId: ${correlationId}`, err);

  res.status(err.status || 500).json({
    error: err.name || "Internal Server Error",
    message: err.message || "An unexpected error occurred processing your request.",
    correlationId,
  });
}
