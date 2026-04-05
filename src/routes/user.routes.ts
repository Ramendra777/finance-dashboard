import { Router } from 'express';
import { listUsers, getUserById, updateUser } from '../controllers/user.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['ADMIN']));

router.get('/', listUsers);
router.get('/:id', getUserById);
router.patch('/:id', updateUser);

export default router;
