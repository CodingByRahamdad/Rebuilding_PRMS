import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { getActivityLogsQuerySchema, createActivityLogSchema } from './analytics.validation';

const analyticsRouter = Router();
const analyticsController = new AnalyticsController();

analyticsRouter.use(authenticate);

analyticsRouter.get('/dashboard', analyticsController.getDashboardStats);
analyticsRouter.get('/activity-logs', validate(getActivityLogsQuerySchema), analyticsController.getActivityLogs);
analyticsRouter.post('/activity-logs', authorize('Super Admin'), validate(createActivityLogSchema), analyticsController.logActivity);

export default analyticsRouter;
