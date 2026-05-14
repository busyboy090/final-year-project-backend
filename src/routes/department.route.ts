import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller.ts';
import { authenticate } from '../middlewares/auth.ts';
import { requireSuperAdmin } from '../middlewares/role.ts';

const router:Router = Router();

// Browse departments for profile completion or event filtering
router.get('/', authenticate, DepartmentController.getAllDepartments);

// Administrative management
router.post(
  '/', 
  authenticate,
  requireSuperAdmin,
  DepartmentController.createDepartment
);

export default router;