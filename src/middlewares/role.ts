import type { Request, Response, NextFunction } from "express";
import RoleService from "../services/role.service.ts";
import type { UserRole } from "../types/user";
import db from "../models/index.ts";

/**
 * Middleware to check if any of the user's multiple roles grant a specific permission.
 */
export const hasPermission = (requiredPermission: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 1. Get the array of role IDs (e.g., [6, 5] for Staff + Event Organiser)
            const roleIds = req.user?.role_ids;

            if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. No roles assigned.",
                });
            }

            // 2. Check if any of the roles possess the required permission
            // We use Promise.all to check all roles in parallel for efficiency
            const checks = await Promise.all(
                roleIds.map(id => RoleService.hasPermission(id, requiredPermission))
            );

            // 3. If 'any' check returns true, the user is authorized
            const isAuthorized = checks.some(result => result === true);

            if (!isAuthorized) {
                return res.status(403).json({
                    success: false,
                    message: `Unauthorized. None of your roles grant the '${requiredPermission}' permission.`,
                });
            }

            next();
        } catch (error) {
            console.error("Multi-role Auth Error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error during authorization.",
            });
        }
    };
};

/**
 * Middleware to restrict access to users who possess at least one of the required roles.
 * @param allowedRoles - An array of role codes (e.g., ['super-admin', 'student-affairs'])
 */
export const hasRole = (allowedRoles: UserRole[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 1. Extract roles from the request (attached by authenticate middleware)
            const userRoles = req.user?.roles;

            if (!userRoles || !Array.isArray(userRoles) || userRoles.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. No roles assigned to your account.",
                });
            }

            // 2. Check if the user has AT LEAST ONE of the required roles
            const isAuthorized = userRoles.some((role) => allowedRoles.includes(role as UserRole));

            if (!isAuthorized) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized. This route is restricted to specific institutional roles.",
                });
            }

            // 3. Authorized
            next();
        } catch (error) {
            console.error("Role Authorization Error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error during role validation.",
            });
        }
    };
};

/**
 * Requires an account with the super-admin role and `admin_profiles.is_super_admin = true`.
 */
export const requireSuperAdminAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = Number(req.user?.userId);
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const roles = req.user?.roles;
        if (!roles?.includes("super-admin")) {
            return res.status(403).json({
                success: false,
                message: "Super administrator access is required.",
            });
        }

        const profile = await db.AdminProfile.findOne({
            where: { user_id: userId, is_super_admin: true },
        });

        if (!profile) {
            return res.status(403).json({
                success: false,
                message: "This action is restricted to the system super administrator.",
            });
        }

        next();
    } catch (error) {
        console.error("Super admin check error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during authorization.",
        });
    }
};