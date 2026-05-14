import { Router } from 'express';
import { LevelController } from '../controllers/level.controller.ts';
import { authenticate } from '../middlewares/auth.ts';
import { requireSuperAdmin } from '../middlewares/role.ts';

const router:Router = Router();

// Browse levels for profile setup or event filtering
router.get('/', authenticate, LevelController.getAllLevels);

// Administrative management
router.post(
  '/', 
  authenticate,
  requireSuperAdmin,
  LevelController.createLevel
);

export default router;