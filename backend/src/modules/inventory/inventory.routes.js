import { Router } from 'express';
import { authenticate, withCompany, can } from '../../middlewares/auth.js';
import * as ctrl from './inventory.controller.js';

const router = Router();
router.use(authenticate, withCompany);

router.get('/stock',         can('inventory.read'),   ctrl.getStock);
router.post('/adjust',       can('inventory.update'),  ctrl.adjustStock);
router.get('/movements',     can('inventory.read'),   ctrl.getMovements);
router.put('/limits',        can('inventory.update'),  ctrl.setStockLimits);

export default router;
