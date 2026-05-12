import type { Request, Response } from "express";
import { TwoFAService } from "../../services/auth/twoFA.service.ts"

export const TwoFAController = {
  toggle: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { enabled } = req.body;

      const updatedUser = await TwoFAService.updateToggle(Number(userId), enabled);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        status: "success",
        message: `Two-factor authentication ${enabled ? "enabled" : "disabled"}`,
        data: updatedUser,
      });
    } catch (error) {
      console.error("2FA Toggle Error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};