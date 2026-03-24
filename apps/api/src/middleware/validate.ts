import type { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { ApiError } from "../utils/api-error";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      next(new ApiError(400, "Validation failed", result.error.flatten()));
      return;
    }

    req.body = result.data.body;
    req.params = result.data.params as typeof req.params;
    req.query = result.data.query as typeof req.query;
    next();
  };
}
