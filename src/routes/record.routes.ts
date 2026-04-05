import { Router } from 'express';
import {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord
} from '../controllers/record.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Base middleware for all record routes
router.use(requireAuth);

// Read operations for ADMIN and ANALYST
router.get('/', requireRole(['ADMIN', 'ANALYST']), getRecords);
router.get('/:id', requireRole(['ADMIN', 'ANALYST']), getRecordById);

// Write operations strictly for ADMIN
router.post('/', requireRole(['ADMIN']), createRecord);
router.patch('/:id', requireRole(['ADMIN']), updateRecord);
router.delete('/:id', requireRole(['ADMIN']), deleteRecord);

export default router;
