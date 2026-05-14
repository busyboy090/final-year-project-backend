import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../types/user";

/**
 * Restricts access to users whose role matches at least one of the allowed roles.
 */
export const hasRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as UserRole | undefined;

    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: "Access denied. No role assigned to your account.",
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. You do not have permission to access this route.",
      });
    }

    next();
  };
};

/**
 * Restricts access to super-admin only.
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const userRole = req.user?.role as UserRole | undefined;

  if (!userRole || userRole !== "super-admin") {
    return res.status(403).json({
      success: false,
      message: "Super administrator access is required.",
    });
  }

  next();
};