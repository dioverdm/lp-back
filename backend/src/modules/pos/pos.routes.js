import { Router } from 'express';
import { authenticate, withCompany, can } from '../../middlewares/auth.js';
import * as ctrl from './pos.controller.js';

const router = Router();
router.use(authenticate, withCompany);

router.get('/orders',               can('orders.read'),        ctrl.listOrders);
router.post('/orders',              can('orders.create'),       ctrl.createOrder);
router.get('/orders/:id',           can('orders.read'),        ctrl.getOrder);
router.post('/orders/:id/pay',      can('orders.update'),       ctrl.payOrder);
router.post('/orders/:id/cancel',   can('orders.update'),       ctrl.cancelOrder);
router.post('/cash-sessions',       can('cash_sessions.create'),ctrl.openCashSession);
router.put('/cash-sessions/:id',    can('cash_sessions.update'),ctrl.closeCashSession);

export default router;
