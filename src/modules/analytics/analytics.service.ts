import { AnalyticsRepository } from './analytics.repository';
import { GetActivityLogsQuery, CreateActivityLogInput } from './analytics.validation';

export class AnalyticsService {
  private analyticsRepository: AnalyticsRepository;

  constructor() {
    this.analyticsRepository = new AnalyticsRepository();
  }

  public async getDashboardStats(timeRange?: string) {
    const data = await this.analyticsRepository.getDashboardStats(timeRange);
    return {
      overview: data.overview,
      patientVisitsTrend: data.patientVisitsTrend,
      departmentDistribution: data.departmentDistribution,
      weeklyAdmissions: data.weeklyAdmissions,
      bedOccupancy: data.bedOccupancy,
      totalCaseloads: data.totalCaseloads,
      recentLogs: data.recentLogs.map((log: any) => (typeof log?.toJSON === 'function' ? log.toJSON() : log)),
    };
  }

  public async getActivityLogs(query: GetActivityLogsQuery) {
    const result = await this.analyticsRepository.findActivityLogs(query);
    return {
      logs: result.logs.map((log: any) => (typeof log?.toJSON === 'function' ? log.toJSON() : log)),
      meta: result.meta,
    };
  }

  public async logActivity(input: CreateActivityLogInput) {
    const log: any = await this.analyticsRepository.createActivityLog({
      user: input.user,
      action: input.action,
      details: input.details,
      time: input.time || new Date().toLocaleString(),
      ipAddress: input.ipAddress || '127.0.0.1',
    });
    return typeof log?.toJSON === 'function' ? log.toJSON() : log;
  }
}
