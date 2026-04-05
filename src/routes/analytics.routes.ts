import { Router } from 'express';
import { getDashboardSummary, getRecentActivity } from '../controllers/analytics.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Base middleware for dashboard endpoints - accessible to all authorized roles
router.use(requireAuth);
// VIEWER, ANALYST, and ADMIN all can view summaries by definition!
router.use(requireRole(['VIEWER', 'ANALYST', 'ADMIN']));

router.get('/summary', getDashboardSummary);
router.get('/recent', getRecentActivity);

export default router;
