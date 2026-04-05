import { Router } from 'express';
import { getDashboardSummary, getRecentActivity, getMonthlyTrends } from '../controllers/analytics.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/summary', getDashboardSummary);
router.get('/recent', getRecentActivity);
router.get('/trends', getMonthlyTrends);

export default router;
