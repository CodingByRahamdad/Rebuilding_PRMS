import { AnalyticsService } from '../../modules/analytics/analytics.service';

const analyticsService = new AnalyticsService();

export interface ActivityActor {
  id?: string;
  email?: string;
  role?: string;
  name?: string;
}

export const logActivity = async (
  actor: ActivityActor | undefined,
  actionType: 'created' | 'updated' | 'deleted',
  entityType: string,
  entityIdName: string,
  ipAddress?: string
) => {
  try {
    const userDisplay = actor
      ? actor.name
        ? `${actor.name} (${actor.role || 'User'})`
        : `${actor.role || 'User'} (${actor.email || actor.id || 'system'})`
      : 'System Administrator';

    const actionTitle = `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} ${entityType}`;
    const details = `${entityType} "${entityIdName}" was ${actionType} successfully.`;

    await analyticsService.logActivity({
      user: userDisplay,
      action: actionTitle,
      details,
      time: new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      ipAddress: ipAddress || '127.0.0.1',
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};
