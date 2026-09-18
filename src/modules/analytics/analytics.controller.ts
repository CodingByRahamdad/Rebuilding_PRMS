import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HttpStatus } from '../../shared/constants/http-status';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  public getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    const timeRange = (req.query.timeRange as string) || 'today';
    const stats = await this.analyticsService.getDashboardStats(timeRange);
    return ApiResponse.success(res, stats, 'Dashboard analytics retrieved successfully', HttpStatus.OK);
  });

  public getActivityLogs = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.analyticsService.getActivityLogs(req.query as any);
    return ApiResponse.paginated(res, result.logs, result.meta, 'Activity logs retrieved successfully');
  });

  public logActivity = asyncHandler(async (req: Request, res: Response) => {
    const log = await this.analyticsService.logActivity(req.body);
    return ApiResponse.created(res, log, 'Activity logged successfully');
  });
}
