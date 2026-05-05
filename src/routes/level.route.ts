import { Router } from 'express';
import { LevelController } from '../controllers/level.controller.ts';
import { authenticate } from '../middlewares/auth.ts';
import { hasPermission, hasRole } from '../middlewares/role.ts';

const router:Router = Router();

// Browse levels for profile setup or event filtering
router.get('/', authenticate, LevelController.getAllLevels);

// Administrative management
router.post(
  '/', 
  authenticate, 
  hasPermission('manage_structure'), 
  hasRole(['super-admin']),
  LevelController.createLevel
);

export default router;