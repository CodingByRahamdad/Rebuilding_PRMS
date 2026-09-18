import mongoose from 'mongoose';
import { ServiceModel, IService } from './models/service.model';
import { GetServicesQuery } from './services.validation';
import { memoryStore } from '../../shared/database/memory-store';
import { assertDatabaseConnection, isDemoModeEnabled, isDbConnected } from '../../shared/database/db-guard';

export class ServiceRepository {
  public async create(data: Partial<IService>): Promise<IService> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        return await ServiceModel.create(data);
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose create service failed, using memory store:', err);
      }
    }

    const newId = `srv-${Date.now()}`;
    const newService: any = {
      _id: newId,
      id: newId,
      name: data.name || 'Medical Service',
      category: data.category || 'General',
      department: data.department || 'General Medicine',
      cost: data.cost || 100,
      description: data.description || '',
      durationMinutes: data.durationMinutes || 30,
      isAvailable: data.isAvailable ?? true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.services.unshift(newService);
    return newService as unknown as IService;
  }

  public async findById(id: string): Promise<IService | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const service = await ServiceModel.findOne({ _id: id, isDeleted: false }).exec();
        if (service) return service;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose findById service failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const service = memoryStore.services.find((s) => (s._id === id || s.id === id) && !s.isDeleted);
    if (!service) return null;
    return service as unknown as IService;
  }

  public async findByName(name: string): Promise<IService | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const service = await ServiceModel.findOne({ name, isDeleted: false }).exec();
        if (service) return service;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose findByName service failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const service = memoryStore.services.find((s) => s.name?.toLowerCase() === name.toLowerCase() && !s.isDeleted);
    if (!service) return null;
    return service as unknown as IService;
  }

  public async findAll(query: GetServicesQuery) {
    assertDatabaseConnection();

    const { page = 1, limit = 50, department, category, isAvailable, search } = query;
    const skip = (page - 1) * limit;

    if (isDbConnected()) {
      try {
        const filter: any = { isDeleted: false };
        if (department) filter.department = department;
        if (category) filter.category = category;
        if (typeof isAvailable === 'boolean') filter.isAvailable = isAvailable;
        if (search) {
          filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } },
            { department: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ];
        }

        const [services, total] = await Promise.all([
          ServiceModel.find(filter)
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)
            .exec(),
          ServiceModel.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limit) || 1;

        return {
          services,
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
        console.warn('⚠️ Mongoose findAll services failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) {
      return {
        services: [],
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

    let filtered = memoryStore.services.filter((s) => !s.isDeleted);
    if (department) filtered = filtered.filter((s) => s.department === department);
    if (category) filtered = filtered.filter((s) => s.category === category);
    if (typeof isAvailable === 'boolean') filtered = filtered.filter((s) => s.isAvailable === isAvailable);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q) ||
          s.department?.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const services = filtered.slice(skip, skip + limit) as unknown as IService[];

    return {
      services,
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

  public async update(id: string, updateData: Partial<IService>): Promise<IService | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const service = await ServiceModel.findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: updateData },
          { returnDocument: 'after', runValidators: true }
        ).exec();
        if (service) return service;
        if (!isDemoModeEnabled()) return null;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose update service failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const service = memoryStore.services.find((s) => (s._id === id || s.id === id) && !s.isDeleted);
    if (!service) return null;
    Object.assign(service, updateData, { updatedAt: new Date() });
    return service as unknown as IService;
  }

  public async softDelete(id: string): Promise<IService | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const service = await ServiceModel.findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: { isDeleted: true, isAvailable: false } },
          { returnDocument: 'after' }
        ).exec();
        if (service) return service;
        if (!isDemoModeEnabled()) return null;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose softDelete service failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const service = memoryStore.services.find((s) => (s._id === id || s.id === id) && !s.isDeleted);
    if (!service) return null;
    service.isDeleted = true;
    service.isAvailable = false;
    service.updatedAt = new Date();
    return service as unknown as IService;
  }
}
