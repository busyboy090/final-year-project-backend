import { Router } from "express";
import type { Request, Response } from "express";
import * as authControllers  from "../controllers/auth/index.ts";
import { authLimiter } from "../middlewares/ratelimiter.ts";
import { validate } from "../middlewares/validate.ts";
import * as authSchema from "../validators/auth/index.ts";
import * as authMiddleware from "../middlewares/auth.ts";

const router: Router = Router();


/**
 * @swagger
 * /api/auth/csrf-token:
 *   get:
 *     tags:
 *       - Security
 *     summary: Get CSRF token
 *     description: Returns a CSRF token that clients must send in the `x-csrf-token` header on POST/PUT/PATCH/DELETE under `/api`. Requires cookies (session + signed CSRF cookie).
 *     responses:
 *       200:
 *         description: CSRF token generated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 csrfToken:
 *                   type: string
 *                   example: 7f4c0d0f-9ef7-4b5f-8f55-3fd9f5f5521a
 *       500:
 *         description: Failed to generate CSRF token.
 */

router.get('/csrf-token', (req: Request, res: Response) => {
  res.status(200).json({ csrfToken: req.csrfToken() })
});


/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     description: Creates an account. Sets `refreshToken` as an HTTP-only cookie on success. Administrators may receive `twoFactorQRCode` and `twoFactorSecret` for initial 2FA setup.
 *     parameters:
 *       - $ref: '#/components/parameters/CsrfHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *               - password
 *               - confirm_password
 *             properties:
 *               first_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               last_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 128
 *                 description: Must include uppercase, lowercase, and a digit.
 *               confirm_password:
 *                 type: string
 *                 description: Must match `password`.
 *     responses:
 *       201:
 *         description: User registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/PublicUser'
 *                     accessToken:
 *                       type: string
 *                     twoFactorQRCode:
 *                       type: string
 *                       description: Base64 QR image data URL (administrator flow).
 *                     twoFactorSecret:
 *                       type: string
 *                       description: Manual 2FA secret entry (administrator flow).
 *       400:
 *         description: Validation or registration error.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *                 - $ref: '#/components/schemas/ErrorMessage'
 *       409:
 *         description: Email already registered.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *             example:
 *               success: false
 *               message: An account with this email already exists
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
router.post("/register",
    validate(authSchema.registerUserSchema),
    authLimiter("register"),
    authControllers.registerController
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Log in
 *     description: Authenticates with email and password. When 2FA is enabled, repeat the request with `twoFactorToken` (TOTP) after `mfaRequired`. Sets `refreshToken` HTTP-only cookie on success.
 *     parameters:
 *       - $ref: '#/components/parameters/CsrfHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               twoFactorToken:
 *                 type: string
 *                 description: TOTP code when 2FA is enabled (second step).
 *     responses:
 *       200:
 *         description: Login success, MFA challenge, or MFA step instructions.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: Login successful
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: Login successful
 *                     data:
 *                       $ref: '#/components/schemas/AuthTokens'
 *                 - type: object
 *                   description: 2FA required (submit TOTP in twoFactorToken)
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     mfaRequired:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: Please enter your 2FA token
 *       400:
 *         description: Validation error or generic login failure.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *                 - $ref: '#/components/schemas/ErrorMessage'
 *       401:
 *         description: Invalid credentials or invalid 2FA code.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       403:
 *         description: Account inactive.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
router.post(
  "/login",
  validate(authSchema.loginUserSchema),
  authLimiter("login"),
  authControllers.loginController
);

router.patch(
  "/verify-email",
  validate(authSchema.otpSchema),
  authLimiter("/verify-email"),
  authMiddleware.verifyTempToken("email_verification"),
  authControllers.emailVerificationController
);

router.get(
  "/refresh-token",
  authControllers.generateNewAccessToken
)

router.post(
  "/logout",
  authControllers.logoutController
)

router.get(
  "/verify-email/session",
  authControllers.verifyTempTokenController("email_verification")
);

router.post(
  "/verify-email/resend-otp",
  authLimiter("/verify-email/resend-otp"),
  authMiddleware.verifyTempToken("email_verification"),
  authControllers.resendOtpController("email_verification")
)

router.get(
  "/session",
  authControllers.isAuthenticatedController
)

// Multi-Factor Authentication route

router.get(
  "/mfa/session",
  authControllers.verifyTempTokenController("mfa")
);

router.post(
  "/verify-mfa",
  validate(authSchema.otpSchema),
  authLimiter("/verify-mfa"),
  authMiddleware.verifyTempToken("mfa"),
  authControllers.verifyMfaController
);

router.post(
  "/mfa/resend-otp",
  authLimiter("/mfa/resend-otp"),
  authMiddleware.verifyTempToken("mfa"),
  authControllers.resendOtpController("mfa")
)

router.post("/clear-temp-token", authControllers.clearTempTokenController);

// Reset password routes
router.post(
  "/reset-password/request",
  validate(authSchema.emailSchema),
  authLimiter("/reset-password/request"),
  authControllers.requestResetPasswordController
)

router.post(
  "/reset-password/verify",
  validate(authSchema.verifyResetPasswordOTPSchema),
  authLimiter("/reset-password/verify"),
  authControllers.verifyResetPasswordOTPController
)

router.patch(
  "/reset-password",
  authMiddleware.verifyTempToken("password_reset"),
  validate(authSchema.resetPasswordSchema),
  authLimiter("/reset-password"),
  authControllers.resetPasswordController
)

router.patch(
  "/reset-password/resend-otp",
  authLimiter("/reset-password/resend-otp"),
  authControllers.resendOtpController("password_reset")
)

router.get(
  "/reset-password/session",
  authControllers.verifyTempTokenController("password_reset")
)

// update 2fa
router.patch(
  "/2fa-toggle", 
  authMiddleware.authenticate, 
  validate(authSchema.toggle2FASchema), 
  authControllers.TwoFAController.toggle
);

export default router;