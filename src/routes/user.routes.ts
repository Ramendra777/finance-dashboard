import { Router } from 'express';
import { listUsers, updateUser } from '../controllers/user.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['ADMIN']));

router.get('/', listUsers);
router.patch('/:id', updateUser);

export default router;
