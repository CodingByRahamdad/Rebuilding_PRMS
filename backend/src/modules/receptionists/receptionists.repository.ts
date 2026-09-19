import mongoose from 'mongoose';
import { ReceptionistModel, IReceptionist } from './models/receptionist.model';
import { GetReceptionistsQuery } from './receptionists.validation';
import { assertDatabaseConnection, isDemoModeEnabled, isDbConnected } from '../../shared/database/db-guard';

export class ReceptionistRepository {
  public async create(data: Partial<IReceptionist>): Promise<IReceptionist> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        return await ReceptionistModel.create(data);
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose create receptionist failed:', err);
      }
    }

    const newRec: any = {
      _id: `rec-${Date.now()}`,
      id: `rec-${Date.now()}`,
      name: data.name || 'Receptionist',
      email: data.email || 'receptionist@prms.hospital',
      phone: data.phone || '+1 (555) 000-0000',
      address: data.address || '742 Evergreen Terrace, Springfield, OR 97477',
      avatar: data.avatar || '',
      department: data.department || 'Admissions',
      shift: data.shift || 'Morning',
      deskNumber: data.deskNumber || 'Desk 1',
      status: data.status || 'Active',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return newRec;
  }

  public async findById(id: string): Promise<IReceptionist | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const rec = await ReceptionistModel.findOne({ _id: id, isDeleted: false }).populate('userId', 'name email role avatar status').exec();
        if (rec) return rec;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose findById receptionist failed:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    return {
      _id: id,
      id: id,
      name: 'David Miller',
      email: 'david.miller@prms.hospital',
      phone: '+1 (555) 771-3342',
      address: '742 Evergreen Terrace, Springfield, OR 97477',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      department: 'Central Intake & Admissions',
      shift: 'Morning',
      deskNumber: 'Desk A-01 (Main Lobby)',
      status: 'Active',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IReceptionist;
  }

  public async findAll(query: GetReceptionistsQuery) {
    assertDatabaseConnection();

    const { page = 1, limit = 15, department, shift, status, search } = query;
    const skip = (page - 1) * limit;

    if (isDbConnected()) {
      try {
        const filter: any = { isDeleted: false };
        if (department) filter.department = department;
        if (shift) filter.shift = shift;
        if (status) filter.status = status;
        if (search) {
          filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { department: { $regex: search, $options: 'i' } },
            { deskNumber: { $regex: search, $options: 'i' } },
          ];
        }

        const [receptionists, total] = await Promise.all([
          ReceptionistModel.find(filter)
            .populate('userId', 'name email role avatar status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec(),
          ReceptionistModel.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limit) || 1;

        return {
          receptionists,
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
        console.warn('⚠️ Mongoose findAll receptionists failed:', err);
      }
    }

    if (!isDemoModeEnabled()) {
      return {
        receptionists: [],
        meta: {
          page,
          limit,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    const defaultReceptionists = [
      {
        _id: 'rec-1',
        id: 'rec-1',
        name: 'Clara Bennett',
        email: 'clara.bennett@meridianhealth.org',
        phone: '+1 (555) 444-1001',
        address: '742 Evergreen Terrace, Springfield, OR 97477',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
        department: 'Central Intake & Admissions',
        shift: 'Morning',
        deskNumber: 'Desk A-01 (Main Lobby)',
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    let filtered = defaultReceptionists;
    if (department) {
      filtered = filtered.filter((r) => r.department.toLowerCase().includes(department.toLowerCase()));
    }
    if (shift) {
      filtered = filtered.filter((r) => r.shift.toLowerCase() === shift.toLowerCase());
    }
    if (status) {
      filtered = filtered.filter((r) => r.status.toLowerCase() === status.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.deskNumber.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = filtered.slice(skip, skip + limit);

    return {
      receptionists: paginated as unknown as IReceptionist[],
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

  public async update(id: string, updateData: Partial<IReceptionist>): Promise<IReceptionist | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        return await ReceptionistModel.findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: updateData },
          { returnDocument: 'after', runValidators: true }
        ).exec();
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose update receptionist failed:', err);
      }
    }
    return null;
  }

  public async softDelete(id: string): Promise<IReceptionist | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        return await ReceptionistModel.findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: { isDeleted: true, status: 'Inactive' } },
          { returnDocument: 'after' }
        ).exec();
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose softDelete receptionist failed:', err);
      }
    }
    return null;
  }
}
