import { Router } from "express";
import * as userController from "../controllers/user/index.ts";
import * as authMiddleware from "../middlewares/auth.ts";
import * as roleMiddleware from "../middlewares/role.ts"
import { validate } from "../middlewares/validate.ts";
import * as userValidators from "../validators/user/index.ts";
import * as rateLimiter from "../middlewares/ratelimiter.ts";

const router: Router = Router();

router.get(
    "/profile/me",
    authMiddleware.authenticate,
    userController.ProfileController.getMyProfile
)

router.post(
    "/profile/student/complete",
    rateLimiter.authLimiter("/profile/student/complete"),
    authMiddleware.authenticate,
    roleMiddleware.hasRole(["student"]),
    validate(userValidators.studentProfileSchema),
    userController.ProfileController.completeStudentProfile
)

export default router;