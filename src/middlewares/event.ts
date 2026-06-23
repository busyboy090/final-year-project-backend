import type { Request, Response, NextFunction } from "express";
import db from "../models/index.ts";

/**
 * Middleware to ensure the authenticated user owns the requested event or is an admin.
 * Grants immediate passage to super-admins, or verifies resource ownership.
 */
export const verifyEventOwner = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Look for ID in route parameters first (/:id), then fallback to query string (?id=)
        const eventId = req.params.id || req.query.id;

        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: "Event ID is required"
            });
        }

        const event = await db.Event.findByPk(Number(eventId));

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // Role-based Override: Admins can bypass structural ownership locks
        if (req.user?.role === "super-admin") {
            return next();
        }

        // Resource Ownership Check
        const isOwner = event.created_by === Number(req.user?.userId);

        if (!isOwner) {
            return res.status(403).json({
                success: false,
                message: "UNAUTHORIZED: You do not have permission to manage this resource"
            });
        }

        next();
    } catch (error) {
        console.error("VERIFY_EVENT_OWNER_ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error during authorization check" 
        });
    }
};
