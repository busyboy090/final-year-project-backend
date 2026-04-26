import type { Request, Response } from "express";

export const clearTempTokenController = (req: Request, res: Response) => {
    try {
        const tempToken = req.signedCookies?.tempToken;

        if (tempToken) res.clearCookie("tempToken");

        return res.send(200);
    } catch (error) {
        console.error("Clear temp token Controller Error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong.",
        });
    }
}