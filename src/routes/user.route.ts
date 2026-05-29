import { Router } from "express";
import * as userController from "../controllers/user/index.ts";
import * as authMiddleware from "../middlewares/auth.ts";
import * as roleMiddleware from "../middlewares/role.ts";
import { validate } from "../middlewares/validate.ts";
import * as userValidators from "../validators/user/index.ts";
import * as rateLimiter from "../middlewares/ratelimiter.ts";

const router: Router = Router();

router.get(
  "/profile/me",
  authMiddleware.authenticate,
  userController.ProfileController.getMyProfile,
);

router.get(
  "/management/users",
  authMiddleware.authenticate,
  roleMiddleware.requireSuperAdmin,
  validate(userValidators.listUsersQuerySchema),
  userController.UserManagementController.list,
);

router.patch(
  "/management/users/:id",
  authMiddleware.authenticate,
  roleMiddleware.requireSuperAdmin,
  validate(userValidators.updateUserSchema),
  userController.UserManagementController.update,
);

router.patch(
  "/profile/student/complete",
  rateLimiter.authLimiter("/profile/student/complete"),
  authMiddleware.authenticate,
  roleMiddleware.hasRole(["student"]),
  validate(userValidators.studentProfileSchema),
  userController.ProfileController.completeStudentProfile,
);

router.patch(
  "/profile/staff/complete",
  rateLimiter.authLimiter("/profile/staff/complete"),
  authMiddleware.authenticate,
  roleMiddleware.hasRole(["staff"]),
  validate(userValidators.staffProfileSchema),
  userController.ProfileController.completeStaffProfile,
);

router.post(
  "/",
  authMiddleware.authenticate,
  roleMiddleware.requireSuperAdmin,
  validate(userValidators.createUserSchema),
  userController.UserManagementController.createUser,
);

router.patch(
  "/set-password",
  validate(userValidators.setPasswordSchema),
  authMiddleware.verifyTempToken("set_password"),
  userController.UserManagementController.setPassword,
);

router.patch(
  "/change-password",
  validate(userValidators.changePasswordSchema),
  authMiddleware.authenticate,
  userController.changePassword,
);

router.patch("/profile/personal",
  authMiddleware.authenticate,
  validate(userValidators.baseUserUpdateSchema),
  userController.ProfileController.updatePersonalInfo
)

export default router;
