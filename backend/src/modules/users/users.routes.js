import { Router } from 'express';
import { authenticate, withCompany, can } from '../../middlewares/auth.js';
import * as ctrl from './users.controller.js';

const router = Router();
router.use(authenticate);

router.get('/invite/:token',         ctrl.acceptInvitation); // público (requiere autenticación)

router.use(withCompany);
router.get('/members',               can('members.read'),  ctrl.listMembers);
router.post('/members/invite',       can('members.invite'),ctrl.inviteMember);
router.put('/members/:userId',       can('members.read'),  ctrl.updateMember);
router.delete('/members/:userId',    can('members.read'),  ctrl.removeMember);
router.get('/branches',              ctrl.getBranches);
router.post('/branches',             can('branches.create'),ctrl.createBranch);
router.put('/company',               ctrl.updateCompany);

export default router;
