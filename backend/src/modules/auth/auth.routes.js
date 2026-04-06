import { Router } from 'express';
import * as ctrl from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

router.post('/register',    ctrl.register);
router.post('/login',       ctrl.login);
router.post('/refresh',     ctrl.refreshToken);
router.post('/logout',      authenticate, ctrl.logout);
router.get('/me',           authenticate, ctrl.me);
router.get('/me/companies', authenticate, ctrl.myCompanies);
router.post('/companies',   authenticate, ctrl.createCompany);

export default router;
