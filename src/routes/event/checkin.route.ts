import { Router } from "express";
import type { Router as RouterType } from "express";
import { checkinWithToken } from "../../controllers/event/checkin.controller.ts";
import { authenticate } from "../../middlewares/auth.ts";

const router: RouterType = Router();

// POST /api/v1/events/enrollments/checkin-with-token
router.post("/", authenticate, checkinWithToken);

export default router;
