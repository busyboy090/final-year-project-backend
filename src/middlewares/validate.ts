import type { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

export const validate = (schema: ZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result: any = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (result.body !== undefined)   req.body   = result.body;
      if (result.query !== undefined)  req.query  = result.query as typeof req.query;
      if (result.params !== undefined) req.params = result.params;

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation Error",
          errors: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      console.error("VALIDATION_MIDDLEWARE_ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };