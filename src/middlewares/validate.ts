import type { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

/**
 * A generic validation middleware for Zod schemas.
 * It validates the request body, query, and params.
 */
export const validate = (schema: ZodObject) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate the request
      await schema.parseAsync({
        body: req.body || {},
        query: req.query,
        params: req.params,
      });

      // If validation passes, proceed to the next middleware/controller
      return next();
    } catch (error) {
      // Handle Zod specific validation errors
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation Error",
          errors: error.issues.map((issue) => ({
            field: issue.path[issue.path.length - 1],
            message: issue.message,
          })),
        });
      }

      // 4. Handle unexpected errors
      console.error("VALIDATION_MIDDLEWARE_ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error during validation",
      });
    }
  };