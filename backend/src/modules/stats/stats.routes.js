import { Router } from 'express';
import { authenticate, withCompany, can } from '../../middlewares/auth.js';
import * as ctrl from './stats.controller.js';

const router = Router();
router.use(authenticate, withCompany);

router.get('/dashboard', can('reports.read'), ctrl.getDashboard);
router.get('/sales',     can('reports.read'), ctrl.getSalesReport);

export default router;
