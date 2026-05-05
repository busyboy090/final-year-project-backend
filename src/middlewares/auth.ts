import * as jwt from './../utils/jwt.ts';
import type { Request, Response, NextFunction } from "express";
import db from "../models/index.ts";
import { ProfileService } from '../services/user/profile.service.ts';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Access denied. No token provided.", 
        code: "UNAUTHORIZED" 
      });
    }

    // 1. Verify Access Token
    const decoded = jwt.verifyAccessToken(token) as {
      userId: string;
      email: string;
      roles: string[];
      permissions: string[];
    };

    // 2. Fetch user with all associated roles
    const user = await db.User.findByPk(Number(decoded.userId), {
      include: [
        {
          model: db.Role,
          as: 'roles', // Using the Many-to-Many association
          attributes: ['code',"id"],
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 3. Extract role codes into an array
    const userRoleCodes = user.roles?.map((r: any) => r.code) || [];
    const userRoleIds = user.roles?.map((r: any) => r.id) || [];

    // 4. Multi-Role Profile Check
    // We check if ALL assigned roles have completed their profiles
    const allProfilesExist = await ProfileService.checkAllUserProfiles(user.id, userRoleCodes);

    /**
     * 5. Handle Incomplete Profile
     * Skips check if calling a completion endpoint.
     * Note: I updated this to check for 'complete' to cover all profile types.
     */
    const isCompletionRoute = req.path.includes('/profile/student/complete'); 
    
    if (!allProfilesExist && !isCompletionRoute) {
      return res.status(403).json({ 
        success: false,
        message: "Please complete your profile to continue.",
        needsProfileCompletion: true,
        user: {
          id: user.id,
          roles: userRoleCodes // Returns the array of roles
        }
      });
    }

    // 6. Attach full decoded payload + latest role data to request
    req.user = {
        ...decoded,
        roles: userRoleCodes,
        role_ids: userRoleIds
    };

    next();
  } catch (error: any) {
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

/**
 * Temp token verification (OTP flows) remains largely the same 
 * but uses your decoded types.
 */
export const verifyTempToken = (type: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tempToken = req.signedCookies.tempToken;

            if (!tempToken) {
                return res.status(401).json({
                    success: false,
                    message: "Verification session expired. Please log in again.",
                    code: "INVALID_TOKEN"
                });
            }

            const decoded = jwt.verifyTempToken(tempToken) as { 
                userId: string; 
                email: string; 
                type: string 
            };

            if (decoded.type.toLowerCase() !== type.toLowerCase()) {
                return res.status(403).json({
                    success: false,
                    message: "Invalid session type for this action.",
                    code: "INVALID_TOKEN"
                });
            }

            const user = await db.User.findByPk(Number(decoded.userId));

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found.",
                });
            }

            req.user = decoded;
            next();
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