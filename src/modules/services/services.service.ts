import { ServiceRepository } from './services.repository';
import { CreateServiceInput, UpdateServiceInput, GetServicesQuery } from './services.validation';
import { ConflictError, NotFoundError } from '../../shared/errors/app-error';
import { logActivity, ActivityActor } from '../../shared/utils/activity-logger';

export class MedicalServicesService {
  private serviceRepository: ServiceRepository;

  constructor() {
    this.serviceRepository = new ServiceRepository();
  }

  public async createService(input: CreateServiceInput, actor?: ActivityActor) {
    const existing = await this.serviceRepository.findByName(input.name);
    if (existing) {
      throw new ConflictError(`Service '${input.name}' already exists.`);
    }

    const service = await this.serviceRepository.create({
      name: input.name,
      category: input.category,
      department: input.department,
      cost: input.cost,
      description: input.description,
      durationMinutes: input.durationMinutes,
      isAvailable: input.isAvailable ?? true,
    });

    const result = service.toJSON();
    await logActivity(actor, 'created', 'Medical Service', service.name);
    return result;
  }

  public async getServices(query: GetServicesQuery) {
    const result = await this.serviceRepository.findAll(query);
    return {
      services: result.services.map((s) => s.toJSON()),
      meta: result.meta,
    };
  }

  public async getServiceById(id: string) {
    const service = await this.serviceRepository.findById(id);
    if (!service) {
      throw new NotFoundError('Service not found.');
    }
    return service.toJSON();
  }

  public async updateService(id: string, input: UpdateServiceInput, actor?: ActivityActor) {
    const service = await this.serviceRepository.findById(id);
    if (!service) {
      throw new NotFoundError('Service not found.');
    }

    if (input.name && input.name !== service.name) {
      const existing = await this.serviceRepository.findByName(input.name);
      if (existing) {
        throw new ConflictError(`Service '${input.name}' already exists.`);
      }
    }

    const updated = await this.serviceRepository.update(id, input);
    const result = updated?.toJSON();
    await logActivity(actor, 'updated', 'Medical Service', updated?.name || service.name);
    return result;
  }

  public async deleteService(id: string, actor?: ActivityActor) {
    const service = await this.serviceRepository.findById(id);
    if (!service) {
      throw new NotFoundError('Service not found.');
    }

    await this.serviceRepository.softDelete(id);
    await logActivity(actor, 'deleted', 'Medical Service', service.name);
  }
}
