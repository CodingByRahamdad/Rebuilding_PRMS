import mongoose from 'mongoose';
import { AppointmentModel, IAppointment } from './models/appointment.model';
import { GetAppointmentsQuery } from './appointments.validation';
import { memoryStore, InMemoryAppointment } from '../../shared/database/memory-store';
import { assertDatabaseConnection, isDemoModeEnabled, isDbConnected } from '../../shared/database/db-guard';

export class AppointmentRepository {
  public async create(data: Partial<IAppointment>): Promise<IAppointment> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        return await AppointmentModel.create(data);
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose create appointment failed, using memory store:', err);
      }
    }

    const newId = `apt-${Date.now()}`;
    const newApt: InMemoryAppointment = {
      _id: newId,
      id: newId,
      patientId: String(data.patientId || 'p-1'),
      patientName: data.patientName || 'Patient',
      doctorId: String(data.doctorId || 'doc-1'),
      doctorName: data.doctorName || 'Dr. Physician',
      department: data.department || 'General Medicine',
      date: data.date || new Date().toISOString().split('T')[0],
      time: data.time || '10:00 AM',
      type: (data.type as any) || 'In-Person',
      status: (data.status as any) || 'Confirmed',
      symptoms: data.symptoms || '',
      notes: data.notes || '',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.appointments.unshift(newApt);
    return newApt as unknown as IAppointment;
  }

  public async findById(id: string): Promise<IAppointment | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const apt = await AppointmentModel.findOne({ _id: id, isDeleted: false }).exec();
        if (apt) return apt;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose findById appointment failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const apt = memoryStore.appointments.find((a) => (a._id === id || a.id === id) && !a.isDeleted);
    if (!apt) return null;
    return apt as unknown as IAppointment;
  }

  public async findAll(query: GetAppointmentsQuery) {
    assertDatabaseConnection();

    const { page = 1, limit = 20, patientId, doctorId, department, date, status, type, search } = query;
    const skip = (page - 1) * limit;

    if (isDbConnected()) {
      try {
        const filter: any = { isDeleted: false };
        if (patientId) filter.patientId = patientId;
        if (doctorId) filter.doctorId = doctorId;
        if (department) filter.department = department;
        if (date) filter.date = date;
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (search) {
          filter.$or = [
            { patientName: { $regex: search, $options: 'i' } },
            { doctorName: { $regex: search, $options: 'i' } },
            { department: { $regex: search, $options: 'i' } },
            { symptoms: { $regex: search, $options: 'i' } },
          ];
        }

        const pipeline: any[] = [
          { $match: filter },
          {
            $addFields: {
              statusPriority: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$status', 'Pending'] }, then: 1 },
                    { case: { $eq: ['$status', 'Confirmed'] }, then: 2 },
                    { case: { $eq: ['$status', 'Completed'] }, then: 3 },
                    { case: { $eq: ['$status', 'Cancelled'] }, then: 4 },
                  ],
                  default: 5,
                },
              },
            },
          },
          {
            $sort: {
              statusPriority: 1,
              date: -1,
              createdAt: -1,
              time: -1,
            },
          },
          {
            $facet: {
              data: [{ $skip: skip }, { $limit: limit }],
              totalCount: [{ $count: 'count' }],
            },
          },
        ];

        const [aggResult] = await AppointmentModel.aggregate(pipeline).exec();
        const rawAppointments = aggResult?.data || [];
        const appointments = rawAppointments.map((item: any) => ({
          ...item,
          id: item.id || item._id?.toString() || String(item._id),
        }));
        const total = aggResult?.totalCount?.[0]?.count || 0;
        const totalPages = Math.ceil(total / limit) || 1;

        return {
          appointments,
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
        console.warn('⚠️ Mongoose findAll appointments failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) {
      return {
        appointments: [],
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

    let filtered = memoryStore.appointments.filter((a) => !a.isDeleted);
    if (patientId) filtered = filtered.filter((a) => a.patientId === patientId);
    if (doctorId) filtered = filtered.filter((a) => a.doctorId === doctorId);
    if (department) filtered = filtered.filter((a) => a.department === department);
    if (date) filtered = filtered.filter((a) => a.date === date);
    if (status) filtered = filtered.filter((a) => a.status === status);
    if (type) filtered = filtered.filter((a) => a.type === type);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.patientName.toLowerCase().includes(q) ||
          a.doctorName.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q) ||
          a.symptoms.toLowerCase().includes(q)
      );
    }

    const getStatusScore = (s: string) => {
      if (s === 'Pending') return 1;
      if (s === 'Confirmed') return 2;
      if (s === 'Completed') return 3;
      if (s === 'Cancelled') return 4;
      return 5;
    };

    filtered.sort((a, b) => {
      const scoreA = getStatusScore(a.status);
      const scoreB = getStatusScore(b.status);
      if (scoreA !== scoreB) return scoreA - scoreB;

      const dateA = new Date(a.date || a.createdAt).getTime() || 0;
      const dateB = new Date(b.date || b.createdAt).getTime() || 0;
      if (dateA !== dateB) return dateB - dateA;

      return (b.time || '').localeCompare(a.time || '');
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const appointments = filtered.slice(skip, skip + limit) as unknown as IAppointment[];

    return {
      appointments,
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

  public async update(id: string, updateData: Partial<IAppointment>): Promise<IAppointment | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const apt = await AppointmentModel.findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: updateData },
          { returnDocument: 'after', runValidators: true }
        ).exec();
        if (apt) return apt;
        if (!isDemoModeEnabled()) return null;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose update appointment failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const apt = memoryStore.appointments.find((a) => (a._id === id || a.id === id) && !a.isDeleted);
    if (!apt) return null;
    Object.assign(apt, updateData, { updatedAt: new Date() });
    return apt as unknown as IAppointment;
  }

  public async softDelete(id: string): Promise<IAppointment | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const apt = await AppointmentModel.findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: { isDeleted: true, status: 'Cancelled' } },
          { returnDocument: 'after' }
        ).exec();
        if (apt) return apt;
        if (!isDemoModeEnabled()) return null;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose softDelete appointment failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const apt = memoryStore.appointments.find((a) => (a._id === id || a.id === id) && !a.isDeleted);
    if (!apt) return null;
    apt.isDeleted = true;
    apt.status = 'Cancelled';
    apt.updatedAt = new Date();
    return apt as unknown as IAppointment;
  }
}
