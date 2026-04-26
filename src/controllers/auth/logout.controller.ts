import type { Request, Response } from "express";

export const logoutController = (req: Request, res: Response) => {
    try {
        const refreshToken = req.signedCookies.refreshToken;

        if (refreshToken) {
            res.clearCookie('refreshToken');
        }

        return res.status(200).json({
            status: "success",
            message: "Logout successful"
        })
    } catch (error) {
        console.error("Logout Error:", error);
        return res.status(500).json({
            success: false,
            message: "An internal error occurred.",
          });
    }
}