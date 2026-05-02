import { Router } from "express";
import { DepartmentController } from "../controllers/department.controller.ts";

const router: Router = Router();

router.get('/', DepartmentController.getAllDepartments)

export default router