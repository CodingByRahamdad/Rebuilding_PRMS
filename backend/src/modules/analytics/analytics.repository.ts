import mongoose from 'mongoose';
import { ActivityLogModel, IActivityLog } from './models/activity-log.model';
import { PatientModel } from '../patients/models/patient.model';
import { DoctorModel } from '../doctors/models/doctor.model';
import { NurseModel } from '../nurses/models/nurse.model';
import { AppointmentModel } from '../appointments/models/appointment.model';
import { PaymentModel } from '../payments/models/payment.model';
import { MedicalRecordModel } from '../medical-records/models/medical-record.model';
import { GetActivityLogsQuery } from './analytics.validation';
import { memoryStore } from '../../shared/database/memory-store';
import { assertDatabaseConnection, isDemoModeEnabled, isDbConnected } from '../../shared/database/db-guard';

export class AnalyticsRepository {
  public async getDashboardStats(timeRange: string = 'today') {
    assertDatabaseConnection();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = now.toISOString().split('T')[0];

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const patientDateFilter =
      timeRange === 'today'
        ? { $or: [{ createdAt: { $gte: startOfToday } }, { admissionDate: todayStr }] }
        : timeRange === 'week'
        ? { $or: [{ createdAt: { $gte: sevenDaysAgo } }, { admissionDate: { $gte: sevenDaysAgoStr } }] }
        : { $or: [{ createdAt: { $gte: thirtyDaysAgo } }, { admissionDate: { $gte: thirtyDaysAgoStr } }] };

    const appointmentDateFilter =
      timeRange === 'today'
        ? { $or: [{ date: todayStr }, { date: 'Today' }] }
        : timeRange === 'week'
        ? { date: { $gte: sevenDaysAgoStr } }
        : { date: { $gte: thirtyDaysAgoStr } };

    const paymentDateFilter =
      timeRange === 'today'
        ? { $or: [{ date: todayStr }, { createdAt: { $gte: startOfToday } }] }
        : timeRange === 'week'
        ? { $or: [{ date: { $gte: sevenDaysAgoStr } }, { createdAt: { $gte: sevenDaysAgo } }] }
        : { $or: [{ date: { $gte: thirtyDaysAgoStr } }, { createdAt: { $gte: thirtyDaysAgo } }] };

    if (isDbConnected()) {
      try {
        const [
          totalPatients,
          totalDoctors,
          totalNurses,
          totalAppointments,
          pendingAppointments,
          completedAppointments,
          totalMedicalRecords,
          paidPayments,
          allPayments,
          recentLogs,
        ] = await Promise.all([
          PatientModel.countDocuments({ isDeleted: false, ...(timeRange !== 'all' ? patientDateFilter : {}) }),
          DoctorModel.countDocuments({ isDeleted: false }),
          NurseModel.countDocuments({ isDeleted: false }),
          AppointmentModel.countDocuments({ isDeleted: false, ...appointmentDateFilter }),
          AppointmentModel.countDocuments({ isDeleted: false, status: 'Pending', ...appointmentDateFilter }),
          AppointmentModel.countDocuments({ isDeleted: false, status: { $in: ['Completed', 'Confirmed'] }, ...appointmentDateFilter }),
          MedicalRecordModel.countDocuments({ isDeleted: false }),
          PaymentModel.aggregate([
            { $match: { isDeleted: false, status: 'Paid', ...paymentDateFilter } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]),
          PaymentModel.aggregate([
            { $match: { isDeleted: false, ...paymentDateFilter } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]),
          ActivityLogModel.find({ isDeleted: false })
            .sort({ createdAt: -1 })
            .limit(10)
            .exec(),
        ]);

        const totalRevenue = paidPayments[0]?.total || 0;
        const totalBilled = allPayments[0]?.total || 0;

        const defaultDeptColors: Record<string, string> = {
          Cardiology: '#0B4F4C',
          Pediatrics: '#10B981',
          Emergency: '#EF4444',
          Surgery: '#3B82F6',
          Neurology: '#F59E0B',
          Other: '#94A3B8',
        };

        const departmentCounts: Record<string, number> = {
          Cardiology: 7,
          Pediatrics: 5,
          Emergency: 5,
          Surgery: 5,
          Neurology: 3,
          Other: 4,
        };

        const totalActiveCaseloads = Object.values(departmentCounts).reduce((a, b) => a + b, 0);

        const isDemo = isDemoModeEnabled();

        const departmentDistribution = isDemo
          ? Object.entries(departmentCounts).map(([name, count]) => ({
              name,
              value: count * 97,
              caseloads: count,
              percentage: `${Math.round((count / totalActiveCaseloads) * 100)}%`,
              color: defaultDeptColors[name] || '#94A3B8',
            }))
          : [];

        const bedOccupancy = isDemo
          ? [
              { department: 'ICU', occupied: 22, total: 24, percentage: 92, color: '#991B1B' },
              { department: 'Cardiology', occupied: 38, total: 45, percentage: 84, color: '#0B4F4C' },
              { department: 'Pediatrics', occupied: 28, total: 40, percentage: 70, color: '#10B981' },
              { department: 'Surgery', occupied: 32, total: 36, percentage: 88, color: '#C2410C' },
              { department: 'Maternity', occupied: 13, total: 19, percentage: 68, color: '#0D9488' },
            ]
          : [];

        const patientVisitsTrend = isDemo
          ? [
              { month: 'Feb', outpatient: 1862, emergency: 930 },
              { month: 'Mar', outpatient: 2350, emergency: 940 },
              { month: 'Apr', outpatient: 2680, emergency: 980 },
              { month: 'May', outpatient: 3120, emergency: 1010 },
              { month: 'Jun', outpatient: 3380, emergency: 1220 },
              { month: 'Jul', outpatient: 3732, emergency: 1390 },
            ]
          : [];

        const weeklyAdmissions = isDemo
          ? [
              { day: 'Monday', admissions: 180 },
              { day: 'Tuesday', admissions: 240 },
              { day: 'Wednesday', admissions: 310 },
              { day: 'Thursday', admissions: 290 },
              { day: 'Friday', admissions: 350 },
              { day: 'Saturday', admissions: 200 },
              { day: 'Sunday', admissions: 165 },
            ]
          : [];

        return {
          overview: {
            timeRange,
            totalPatients: isDemo ? (totalPatients > 0 ? totalPatients : (timeRange === 'today' ? 4 : timeRange === 'week' ? 16 : 29)) : totalPatients,
            totalDoctors,
            totalNurses,
            totalAppointments: isDemo ? (totalAppointments > 0 ? totalAppointments : (timeRange === 'today' ? 7 : timeRange === 'week' ? 19 : 48)) : totalAppointments,
            pendingAppointments: isDemo ? (pendingAppointments > 0 ? pendingAppointments : (timeRange === 'today' ? 5 : timeRange === 'week' ? 8 : 14)) : pendingAppointments,
            completedAppointments: isDemo ? (completedAppointments > 0 ? completedAppointments : (timeRange === 'today' ? 2 : timeRange === 'week' ? 11 : 34)) : completedAppointments,
            totalMedicalRecords,
            totalRevenue: isDemo ? (totalRevenue > 0 ? totalRevenue : (timeRange === 'today' ? 2450 : timeRange === 'week' ? 8950 : 14850)) : totalRevenue,
            totalBilled: isDemo ? (totalBilled > 0 ? totalBilled : (timeRange === 'today' ? 3100 : timeRange === 'week' ? 11200 : 18500)) : totalBilled,
          },
          patientVisitsTrend,
          departmentDistribution,
          weeklyAdmissions,
          bedOccupancy,
          totalCaseloads: isDemo ? 29 : 0,
          recentLogs,
        };
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose analytics stats query failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) {
      return {
        overview: {
          timeRange,
          totalPatients: 0,
          totalDoctors: 0,
          totalNurses: 0,
          totalAppointments: 0,
          pendingAppointments: 0,
          completedAppointments: 0,
          totalMedicalRecords: 0,
          totalRevenue: 0,
          totalBilled: 0,
        },
        patientVisitsTrend: [],
        departmentDistribution: [],
        weeklyAdmissions: [],
        bedOccupancy: [],
        totalCaseloads: 0,
        recentLogs: [],
      };
    }

    // In-memory fallback
    const allActivePatients = memoryStore.patients.filter((p) => !p.isDeleted);
    let filteredPatients = allActivePatients;
    if (timeRange === 'today') {
      const matches = allActivePatients.filter(
        (p) => p.admissionDate === todayStr || (p.createdAt && new Date(p.createdAt) >= startOfToday)
      );
      filteredPatients = matches.length > 0 ? matches : allActivePatients.slice(0, 4);
    } else if (timeRange === 'week') {
      const matches = allActivePatients.filter(
        (p) => p.admissionDate >= sevenDaysAgoStr || (p.createdAt && new Date(p.createdAt) >= sevenDaysAgo)
      );
      filteredPatients = matches.length > 0 ? matches : allActivePatients.slice(0, 16);
    }

    const totalPatients = filteredPatients.length;
    const totalDoctors = memoryStore.doctors.filter((d) => !d.isDeleted).length;
    const totalNurses = 4;
    
    let filteredApts = memoryStore.appointments.filter((a) => !a.isDeleted);
    if (timeRange === 'today') {
      const matches = filteredApts.filter((a) => a.date === todayStr || a.date === 'Today' || a.date === '2026-07-28');
      filteredApts = matches.length > 0 ? matches : filteredApts.slice(0, 7);
    } else if (timeRange === 'week') {
      const matches = filteredApts.filter((a) => !a.date || a.date >= sevenDaysAgoStr || a.date === 'Today' || a.date === '2026-07-28');
      filteredApts = matches.length > 0 ? matches : filteredApts.slice(0, 19);
    } else if (timeRange === 'month') {
      const matches = filteredApts.filter((a) => !a.date || a.date >= thirtyDaysAgoStr || a.date === 'Today' || a.date === '2026-07-28');
      filteredApts = matches.length > 0 ? matches : filteredApts;
    }

    const totalAppointments = filteredApts.length;
    const pendingAppointments = filteredApts.filter((a) => a.status === 'Pending').length || (timeRange === 'today' ? 5 : timeRange === 'week' ? 8 : 14);
    const completedAppointments = filteredApts.filter((a) => a.status === 'Completed' || a.status === 'Confirmed').length || (timeRange === 'today' ? 2 : timeRange === 'week' ? 11 : 34);
    const totalMedicalRecords = memoryStore.medicalRecords.filter((m) => !m.isDeleted).length;

    let paymentMatches = memoryStore.payments.filter((p) => !p.isDeleted);
    if (timeRange === 'today') {
      paymentMatches = paymentMatches.filter((p) => p.date === todayStr || p.date === 'Today');
    } else if (timeRange === 'week') {
      paymentMatches = paymentMatches.filter((p) => !p.date || p.date >= sevenDaysAgoStr || p.date === 'Today');
    } else if (timeRange === 'month') {
      paymentMatches = paymentMatches.filter((p) => !p.date || p.date >= thirtyDaysAgoStr || p.date === 'Today');
    }

    const calculatedRevenue = paymentMatches
      .filter((p) => p.status === 'Paid' || (p.status as any) === 'Completed' || (p.status as any) === 'Partial')
      .reduce((sum, p) => {
        if (p.status === 'Paid' || (p.status as any) === 'Completed') {
          return sum + (typeof p.paidAmount === 'number' ? p.paidAmount : (p.amount || 0));
        }
        if ((p.status as any) === 'Partial') {
          return sum + (typeof p.paidAmount === 'number' ? p.paidAmount : Math.round((p.amount || 0) * 0.5));
        }
        return sum;
      }, 0);

    const calculatedBilled = paymentMatches
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalRevenue = calculatedRevenue;
    const totalBilled = calculatedBilled;

    const defaultDeptColors: Record<string, string> = {
      Cardiology: '#0B4F4C',
      Pediatrics: '#10B981',
      Emergency: '#EF4444',
      Surgery: '#3B82F6',
      Neurology: '#F59E0B',
      Other: '#94A3B8',
    };

    const departmentCounts: Record<string, number> = {
      Cardiology: 7,
      Pediatrics: 5,
      Emergency: 5,
      Surgery: 5,
      Neurology: 3,
      Other: 4,
    };

    const totalActiveCaseloads = Object.values(departmentCounts).reduce((a, b) => a + b, 0);

    const isDemo = isDemoModeEnabled();

    const departmentDistribution = isDemo
      ? Object.entries(departmentCounts).map(([name, count]) => ({
          name,
          value: count * 97,
          caseloads: count,
          percentage: `${Math.round((count / totalActiveCaseloads) * 100)}%`,
          color: defaultDeptColors[name] || '#94A3B8',
        }))
      : [];

    const bedOccupancy = isDemo
      ? [
          { department: 'ICU', occupied: 22, total: 24, percentage: 92, color: '#991B1B' },
          { department: 'Cardiology', occupied: 38, total: 45, percentage: 84, color: '#0B4F4C' },
          { department: 'Pediatrics', occupied: 28, total: 40, percentage: 70, color: '#10B981' },
          { department: 'Surgery', occupied: 32, total: 36, percentage: 88, color: '#C2410C' },
          { department: 'Maternity', occupied: 13, total: 19, percentage: 68, color: '#0D9488' },
        ]
      : [];

    const patientVisitsTrend = isDemo
      ? [
          { month: 'Feb', outpatient: 1862, emergency: 930 },
          { month: 'Mar', outpatient: 2350, emergency: 940 },
          { month: 'Apr', outpatient: 2680, emergency: 980 },
          { month: 'May', outpatient: 3120, emergency: 1010 },
          { month: 'Jun', outpatient: 3380, emergency: 1220 },
          { month: 'Jul', outpatient: 3732, emergency: 1390 },
        ]
      : [];

    const weeklyAdmissions = isDemo
      ? [
          { day: 'Monday', admissions: 180 },
          { day: 'Tuesday', admissions: 240 },
          { day: 'Wednesday', admissions: 310 },
          { day: 'Thursday', admissions: 290 },
          { day: 'Friday', admissions: 350 },
          { day: 'Saturday', admissions: 200 },
          { day: 'Sunday', admissions: 165 },
        ]
      : [];

    return {
      overview: {
        timeRange,
        totalPatients,
        totalDoctors,
        totalNurses,
        totalAppointments,
        pendingAppointments,
        completedAppointments,
        totalMedicalRecords,
        totalRevenue,
        totalBilled,
      },
      patientVisitsTrend,
      departmentDistribution,
      weeklyAdmissions,
      bedOccupancy,
      totalCaseloads: isDemo ? 29 : 0,
      recentLogs: memoryStore.activityLogs.slice(0, 10),
    };
  }

  public async createActivityLog(data: Partial<IActivityLog>): Promise<IActivityLog> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        return await ActivityLogModel.create(data);
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose create activity log failed, using memory store:', err);
      }
    }

    const newLog: any = {
      _id: `log-${Date.now()}`,
      user: data.user || 'System User',
      action: data.action || 'ACTIVITY',
      details: data.details || '',
      time: data.time || new Date().toLocaleString(),
      ipAddress: data.ipAddress || '127.0.0.1',
      isDeleted: false,
      createdAt: new Date(),
    };
    memoryStore.activityLogs.unshift(newLog);
    return newLog;
  }

  public async findActivityLogs(query: GetActivityLogsQuery) {
    assertDatabaseConnection();

    const { page = 1, limit = 50, search, user } = query;
    const skip = (page - 1) * limit;

    if (isDbConnected()) {
      try {
        const filter: any = { isDeleted: false };
        if (user) filter.user = user;
        if (search) {
          filter.$or = [
            { user: { $regex: search, $options: 'i' } },
            { action: { $regex: search, $options: 'i' } },
            { details: { $regex: search, $options: 'i' } },
          ];
        }

        const [logs, total] = await Promise.all([
          ActivityLogModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec(),
          ActivityLogModel.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limit) || 1;

        return {
          logs,
          meta: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        };
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose findActivityLogs failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) {
      return {
        logs: [],
        meta: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    let filtered = memoryStore.activityLogs.filter((l: any) => !l.isDeleted);
    if (user) filtered = filtered.filter((l: any) => l.user === user);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (l: any) =>
          l.user?.toLowerCase().includes(q) ||
          l.action?.toLowerCase().includes(q) ||
          l.details?.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const logs = filtered.slice(skip, skip + limit);

    return {
      logs,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}
