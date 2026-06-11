import type { Request, Response } from "express";
import CheckinService from "../../services/event/checkin.service.ts";

export const checkinWithToken = async (req: Request, res: Response) => {
  try {
    const { token, scanner_id } = req.body;
    if (!token)
      return res
        .status(400)
        .json({ success: false, message: "Token is required" });

    const result = await CheckinService.checkinWithToken(
      String(token),
      scanner_id ? String(scanner_id) : undefined,
    );

    return res.status(result.code).json({
      success: result.ok,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("CHECKIN_CONTROLLER_ERROR:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
