import { Router } from "express";
import * as authControllers from "../controllers/auth/index.ts";
import { authLimiter } from "../middlewares/ratelimiter.ts";
import { validate } from "../middlewares/validate.ts";
import * as authSchema from "../validators/auth/index.ts";
import * as authMiddleware from "../middlewares/auth.ts";

const router: Router = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     description: Creates an account. Sets `refreshToken` as an HTTP-only cookie on success.
 *     parameters:
 *       - $ref: '#/components/parameters/CsrfHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully.
 */
router.post(
  "/register",
  validate(authSchema.registerUserSchema),
  authLimiter("register"),
  authControllers.registerController,
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Log in
 *     parameters:
 *       - $ref: '#/components/parameters/CsrfHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login success or MFA challenge.
 */
router.post(
  "/login",
  validate(authSchema.loginUserSchema),
  authLimiter("login"),
  authControllers.loginController,
);

/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   patch:
 *     tags:
 *       - Auth
 *     summary: Verify email using OTP
 *     parameters:
 *       - $ref: '#/components/parameters/CsrfHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OtpRequest'
 *     responses:
 *       '200':
 *         description: Email verified
 */
router.patch(
  "/verify-email",
  validate(authSchema.otpSchema),
  authLimiter("/verify-email"),
  authMiddleware.verifyTempToken("email_verification"),
  authControllers.emailVerificationController,
);

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Exchange refresh token for a new access token
 *     responses:
 *       200:
 *         description: New access token returned
 */
router.post("/refresh-token", authControllers.generateNewAccessToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout and clear refresh token cookie
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", authControllers.logoutController);

/**
 * @swagger
 * /api/v1/auth/verify-email/session:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Check email verification temp-token session
 *     responses:
 *       200:
 *         description: Temp token session valid
 */
router.get(
  "/verify-email/session",
  authControllers.verifyTempTokenController("email_verification"),
);

/**
 * @swagger
 * /api/v1/auth/verify-email/resend-otp:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Resend email verification OTP
 *     responses:
 *       200:
 *         description: OTP resent
 */
router.post(
  "/verify-email/resend-otp",
  authLimiter("/verify-email/resend-otp"),
  authMiddleware.verifyTempToken("email_verification"),
  authControllers.resendOtpController("email_verification"),
);

/**
 * @swagger
 * /api/v1/auth/session:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Check if the current request is authenticated (access token)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated session info
 */
router.get("/session", authControllers.isAuthenticatedController);

/**
 * @swagger
 * /api/v1/auth/mfa/session:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Check MFA temp-token session
 *     responses:
 *       200:
 *         description: MFA temp token session valid
 */
router.get("/mfa/session", authControllers.verifyTempTokenController("mfa"));

/**
 * @swagger
 * /api/v1/auth/verify-mfa:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify Multi-Factor Authentication OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OtpRequest'
 *     responses:
 *       200:
 *         description: MFA verified
 */
router.post(
  "/verify-mfa",
  validate(authSchema.otpSchema),
  authLimiter("/verify-mfa"),
  authMiddleware.verifyTempToken("mfa"),
  authControllers.verifyMfaController,
);

/**
 * @swagger
 * /api/v1/auth/mfa/resend-otp:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Resend MFA OTP
 *     responses:
 *       200:
 *         description: MFA OTP resent
 */
router.post(
  "/mfa/resend-otp",
  authLimiter("/mfa/resend-otp"),
  authMiddleware.verifyTempToken("mfa"),
  authControllers.resendOtpController("mfa"),
);

/**
 * @swagger
 * /api/v1/auth/clear-temp-token:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Clear any temporary token stored in session/cookie
 *     responses:
 *       200:
 *         description: Temp token cleared
 */
router.post("/clear-temp-token", authControllers.clearTempTokenController);

/**
 * @swagger
 * /api/v1/auth/reset-password/request:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Request a password reset OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailRequest'
 *     responses:
 *       200:
 *         description: OTP sent if email exists
 */
router.post(
  "/reset-password/request",
  validate(authSchema.emailSchema),
  authLimiter("/reset-password/request"),
  authControllers.requestResetPasswordController,
);

/**
 * @swagger
 * /api/v1/auth/reset-password/verify:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify reset password OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyResetPasswordRequest'
 *     responses:
 *       200:
 *         description: OTP verified, temp token issued
 */
router.post(
  "/reset-password/verify",
  validate(authSchema.verifyResetPasswordOTPSchema),
  authLimiter("/reset-password/verify"),
  authControllers.verifyResetPasswordOTPController,
);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   patch:
 *     tags:
 *       - Auth
 *     summary: Set a new password using reset password temp token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.patch(
  "/reset-password",
  authMiddleware.verifyTempToken("password_reset"),
  validate(authSchema.resetPasswordSchema),
  authLimiter("/reset-password"),
  authControllers.resetPasswordController,
);

/**
 * @swagger
 * /api/v1/auth/reset-password/resend-otp:
 *   patch:
 *     tags:
 *       - Auth
 *     summary: Resend reset-password OTP
 *     responses:
 *       200:
 *         description: OTP resent
 */
router.patch(
  "/reset-password/resend-otp",
  authLimiter("/reset-password/resend-otp"),
  authControllers.resendOtpController("password_reset"),
);

/**
 * @swagger
 * /api/v1/auth/reset-password/session:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Check reset-password temp-token session
 *     responses:
 *       200:
 *         description: Temp token session valid
 */
router.get(
  "/reset-password/session",
  authControllers.verifyTempTokenController("password_reset"),
);

/**
 * @swagger
 * /api/v1/auth/set-password/session:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Check set-password temp-token session
 *     responses:
 *       200:
 *         description: Temp token session valid
 */
router.get(
  "/set-password/session",
  authControllers.verifyTempTokenController("set_password"),
);

/**
 * @swagger
 * /api/v1/auth/2fa-toggle:
 *   patch:
 *     tags:
 *       - Auth
 *     summary: Toggle Two Factor Authentication for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 2FA updated
 */
router.patch(
  "/2fa-toggle",
  authMiddleware.authenticate,
  validate(authSchema.toggle2FASchema),
  authControllers.TwoFAController.toggle,
);

export default router;
