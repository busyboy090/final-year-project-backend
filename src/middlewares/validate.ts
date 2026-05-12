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

      if (result.body) Object.assign(req.body, result.body);
      if (result.query) Object.assign(req.query, result.query);
      if (result.params) Object.assign(req.params, result.params);

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