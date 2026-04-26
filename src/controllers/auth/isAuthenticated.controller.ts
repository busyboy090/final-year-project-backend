import type { Request, Response } from "express";
import * as jwt from "../../utils/jwt.ts";
import db from "../../models/index.ts";

export const isAuthenticatedController = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.signedCookies.refreshToken;

        if (!refreshToken) {
            return res.status(200).json({
                success: true,
                isAuthenticated: false
            });
        }

        const decoded = jwt.verifyRefreshToken(refreshToken);

        // find user
        const user = await db.User.findByPk(Number(decoded.userId));

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            isAuthenticated: true
        })
    } catch (error: any) {
        // If jwt.verify fails, it throws an error we catch here
        if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
            return res.status(200).json({
                success: false,
                isAuthenticated: false
            });
        }

        console.error("Check if authenticated Token Error:", error);
        return res.status(500).json({
            success: false,
            message: "An internal error occurred.",
        });
    }
}