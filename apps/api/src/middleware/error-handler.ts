import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      message: error.message,
      details: error.details ?? null
    });
    return;
  }

  const fallback = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({
    message: fallback
  });
}
