import { Router } from "express";
import type { Router as RouterType } from "express";
import { checkinWithToken } from "../../controllers/event/checkin.controller.ts";

const router: RouterType = Router();

// POST /api/v1/events/enrollments/checkin-with-token
router.post("/", checkinWithToken);

export default router;
