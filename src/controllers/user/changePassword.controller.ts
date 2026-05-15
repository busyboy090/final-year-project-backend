import type { Request, Response } from "express";
import changePasswordService from "../../services/user/changePassword.service.ts";

export async function changePassword(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const { current_password, new_password } = req.body;
    
    const result = await changePasswordService(Number(userId), {
      current_p: current_password,
      new_p: new_password,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    // Map service errors to appropriate status codes
    const status = error.message.includes("Incorrect") ? 400 : 500;

    return res.status(status).json({
      success: false,
      message: error.message || "An internal error occurred.",
    });
  }
}
