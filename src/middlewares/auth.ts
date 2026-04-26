import * as jwt from './../utils/jwt.ts';
import type { Request, Response, NextFunction } from "express";
import db from "../models/index.ts";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header (Bearer <token>)
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Access denied. No token provided.", 
        code: "UNAUTHORIZED" 
      });
    }

    // Verify the token
    const decoded = jwt.verifyAccessToken(token);

    // Attach the payload to the request object
    req.user = decoded;

    // Move to the next middleware/controller
    next();
  } catch (error: any) {
    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired.",
        code: "TOKEN_EXPIRED"
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
        code: "INVALID_TOKEN"
      });
    }

    console.error("Auth Middleware Error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal error occurred during authentication.",
    });
  }
};

export const verifyTempToken = (type: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 1. Extract the tempToken from the HTTP-only cookie
            const tempToken = req.signedCookies.tempToken;

            if (!tempToken) {
                return res.status(401).json({
                    success: false,
                    message: "Verification session expired. Please log in again.",
                    code: "INVALID_TOKEN"
                });
            }

            // 2. Verify the token using your utility
            const decoded = jwt.verifyTempToken(tempToken) as { 
                userId: string; 
                email: string; 
                type: string 
            };

            // --- CHECK THE TYPE ---
            if (decoded.type.toLowerCase() !== type.toLowerCase()) {
                return res.status(403).json({
                    success: false,
                    message: "Invalid session type for this action.",
                    code: "INVALID_TOKEN"
                });
            }

            // 3. Find user 
            const user = await db.User.findByPk(Number(decoded.userId));

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found.",
                });
            }

            req.user = decoded;
            next()
        } catch (error: any) {
            if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
                return res.status(403).json({
                    success: false,
                    message: "Your session has expired. Please log in to request a new code.",
                    code: "INVALID_TOKEN"
                });
            }

            console.error("Verify Temp Token Error:", error);
            return res.status(500).json({
                success: false,
                message: "An internal error occurred.",
            });
        }
    };
};