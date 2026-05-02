import { Router } from "express";
import { LevelController } from "../controllers/level.controller.ts";

const router: Router = Router();

router.get(
    "/",
    LevelController.getLevels
)

export default router;