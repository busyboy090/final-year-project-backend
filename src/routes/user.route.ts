import { Router } from "express";
import * as userController from "../controllers/user/index.ts";
import * as authMiddleware from "../middlewares/auth.ts";
import * as roleMiddleware from "../middlewares/role.ts";
import { validate } from "../middlewares/validate.ts";
import * as userValidators from "../validators/user/index.ts";
import * as rateLimiter from "../middlewares/ratelimiter.ts";

const router: Router = Router();

/**
 * @swagger
 * /api/v1/user/profile/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get my profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get(
  "/profile/me",
  authMiddleware.authenticate,
  userController.ProfileController.getMyProfile,
);

/**
 * @swagger
 * /api/v1/user/management/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: List users (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get(
  "/management/users",
  authMiddleware.authenticate,
  roleMiddleware.requireSuperAdmin,
  validate(userValidators.listUsersQuerySchema),
  userController.UserManagementController.list,
);

/**
 * @swagger
 * /api/v1/user/management/users/{id}:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update user (admin)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PublicUser'
 */
router.patch(
  "/management/users/:id",
  authMiddleware.authenticate,
  roleMiddleware.requireSuperAdmin,
  validate(userValidators.updateUserSchema),
  userController.UserManagementController.update,
);

/**
 * @swagger
 * /api/v1/user/profile/student/complete:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Complete student profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CsrfHeader'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 */
router.patch(
  "/profile/student/complete",
  rateLimiter.authLimiter("/profile/student/complete"),
  authMiddleware.authenticate,
  roleMiddleware.hasRole(["student"]),
  validate(userValidators.studentProfileSchema),
  userController.ProfileController.completeStudentProfile,
);

/**
 * @swagger
 * /api/v1/user/profile/staff/complete:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Complete staff profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 */
router.patch(
  "/profile/staff/complete",
  rateLimiter.authLimiter("/profile/staff/complete"),
  authMiddleware.authenticate,
  roleMiddleware.hasRole(["staff"]),
  validate(userValidators.staffProfileSchema),
  userController.ProfileController.completeStaffProfile,
);

/**
 * @swagger
 * /api/v1/user:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create a user (admin)
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/",
  authMiddleware.authenticate,
  roleMiddleware.requireSuperAdmin,
  validate(userValidators.createUserSchema),
  userController.UserManagementController.createUser,
);

/**
 * @swagger
 * /api/v1/user/set-password:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Set password using set_password temp token
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 */
router.patch(
  "/set-password",
  validate(userValidators.setPasswordSchema),
  authMiddleware.verifyTempToken("set_password"),
  userController.UserManagementController.setPassword,
);

/**
 * @swagger
 * /api/v1/user/change-password:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Change current user's password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 */
router.patch(
  "/change-password",
  validate(userValidators.changePasswordSchema),
  authMiddleware.authenticate,
  userController.changePassword,
);

/**
 * @swagger
 * /api/v1/user/profile/personal:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update personal info
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 */
router.patch(
  "/profile/personal",
  authMiddleware.authenticate,
  validate(userValidators.baseUserUpdateSchema),
  userController.ProfileController.updatePersonalInfo,
);

export default router;
