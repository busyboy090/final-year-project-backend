import type { Request, Response } from "express";
import { registerUser } from "../../services/auth/register.service.ts";
import config from "../../configs/env.ts"

export const registerController = async (req: Request, res: Response) => {
  try {
    const result = await registerUser(req.body);

    // Handle Business Logic Errors
    if (!result.ok) {
      switch (result.reason) {
        case "EMAIL_EXISTS":
          return res.status(409).json({
            success: false,
            message: "An account with this email already exists",
          });

        case "VERIFICATION_EMAIL_SEND_FAILED":
          return res.status(500).json({
            success: false,
            message: "Account created, but verification email could not be sent",
          });

        default:
          return res.status(400).json({
            success: false,
            message: result.reason || "Registration failed",
          });
      }
    }

    if (result.tempToken) {
      res.cookie("tempToken", result.tempToken, {
        httpOnly: true,
        signed: true,
        secure: config.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes 
      });
    }

    // Success Case
    return res.status(201).json({
      success: true,
      message: "User registered successfully. Please verify your email before logging in.",
      user: result.user,
      verificationEmailSent: result.verificationEmailSent
    });

  } catch (error) {
    console.error("Register Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register user due to an internal server error",
    });
  }
};