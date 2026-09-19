import mongoose, { Types } from 'mongoose';
import { UserModel, IUser } from './models/user.model';
import { GetUserQuery } from './users.validation';
import { memoryStore, InMemoryUser } from '../../shared/database/memory-store';
import { assertDatabaseConnection, isDemoModeEnabled, isDbConnected } from '../../shared/database/db-guard';

export class UserRepository {
  public async create(userData: Partial<IUser>): Promise<IUser> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        return await UserModel.create(userData);
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose create failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) {
      throw new Error('Database disconnected and demo mode is disabled.');
    }

    const newUser: InMemoryUser = {
      _id: `u-${Date.now()}`,
      name: userData.name || 'Anonymous',
      email: (userData.email || '').toLowerCase(),
      passwordHash: userData.passwordHash || '',
      role: userData.role || 'Doctor',
      avatar: userData.avatar || '',
      status: userData.status || 'Active',
      phone: userData.phone || '+1 (555) 000-0000',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.users.unshift(newUser);
    return newUser as unknown as IUser;
  }

  public async findById(id: string): Promise<IUser | null> {
    assertDatabaseConnection();

    if (isDbConnected() && Types.ObjectId.isValid(id)) {
      try {
        const user = await UserModel.findOne({ _id: id, isDeleted: false }).exec();
        if (user) return user;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose query failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const user = memoryStore.users.find((u) => (u._id === id || u.id === id) && !u.isDeleted);
    if (!user) return null;
    return user as unknown as IUser;
  }

  public async findByEmail(email: string): Promise<IUser | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const user = await UserModel.findOne({ email: email.toLowerCase(), isDeleted: false }).exec();
        if (user) return user;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose query failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const user = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && !u.isDeleted);
    if (!user) return null;
    return user as unknown as IUser;
  }

  public async findAll(query: GetUserQuery) {
    assertDatabaseConnection();

    const { page = 1, limit = 10, role, status, search } = query;
    const skip = (page - 1) * limit;

    if (isDbConnected()) {
      try {
        const filter: any = { isDeleted: false };
        if (role) filter.role = role;
        if (status) filter.status = status;
        if (search) {
          filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
          ];
        }

        const [users, total] = await Promise.all([
          UserModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec(),
          UserModel.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limit) || 1;

        return {
          users,
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
        console.warn('⚠️ Mongoose findAll failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) {
      return {
        users: [],
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

    // In-memory filter
    let filtered = memoryStore.users.filter((u) => !u.isDeleted);
    if (role) filtered = filtered.filter((u) => u.role === role);
    if (status) filtered = filtered.filter((u) => u.status === status);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const users = filtered.slice(skip, skip + limit) as unknown as IUser[];

    return {
      users,
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

  public async update(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const user = await UserModel.findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: updateData },
          { returnDocument: 'after', runValidators: true }
        ).exec();
        if (user) return user;
        if (!isDemoModeEnabled()) return null;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose update failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const user = memoryStore.users.find((u) => (u._id === id || u.id === id) && !u.isDeleted);
    if (!user) return null;
    Object.assign(user, updateData, { updatedAt: new Date() });
    return user as unknown as IUser;
  }

  public async softDelete(id: string): Promise<IUser | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const user = await UserModel.findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: { isDeleted: true, status: 'Inactive' } },
          { returnDocument: 'after' }
        ).exec();
        if (user) return user;
        if (!isDemoModeEnabled()) return null;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose softDelete failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const user = memoryStore.users.find((u) => (u._id === id || u.id === id) && !u.isDeleted);
    if (!user) return null;
    user.isDeleted = true;
    user.status = 'Inactive';
    user.updatedAt = new Date();
    return user as unknown as IUser;
  }
}
