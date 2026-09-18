import { ReceptionistRepository } from './receptionists.repository';
import { UserRepository } from '../users/users.repository';
import {
  CreateReceptionistInput,
  UpdateReceptionistInput,
  GetReceptionistsQuery,
} from './receptionists.validation';
import { AuthUtils } from '../auth/auth.utils';
import { NotFoundError } from '../../shared/errors/app-error';
import { logActivity, ActivityActor } from '../../shared/utils/activity-logger';

export class ReceptionistService {
  private receptionistRepository: ReceptionistRepository;
  private userRepository: UserRepository;

  constructor() {
    this.receptionistRepository = new ReceptionistRepository();
    this.userRepository = new UserRepository();
  }

  public async createReceptionist(input: CreateReceptionistInput, actor?: ActivityActor) {
    const existingUser = await this.userRepository.findByEmail(input.email);
    let userId: string;

    if (existingUser) {
      userId = existingUser._id.toString();
    } else {
      const passwordHash = await AuthUtils.hashPassword(input.password || 'ReceptionistPass123!');
      const newUser = await this.userRepository.create({
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        role: 'Receptionist',
        phone: input.phone,
        avatar: input.avatar || '',
        status: input.status || 'Active',
      });
      userId = newUser._id.toString();
    }

    const receptionist = await this.receptionistRepository.create({
      userId: userId as any,
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      address: input.address || '',
      avatar: input.avatar || '',
      department: input.department,
      shift: input.shift,
      deskNumber: input.deskNumber,
      status: input.status || 'Active',
    });

    const result = typeof receptionist.toJSON === 'function' ? receptionist.toJSON() : receptionist;
    await logActivity(actor, 'created', 'Receptionist', receptionist.name);
    return result;
  }

  public async getReceptionists(query: GetReceptionistsQuery) {
    const result = await this.receptionistRepository.findAll(query);
    return {
      receptionists: result.receptionists.map((r) => (typeof r.toJSON === 'function' ? r.toJSON() : r)),
      meta: result.meta,
    };
  }

  public async getReceptionistById(id: string) {
    const receptionist = await this.receptionistRepository.findById(id);
    if (!receptionist) {
      throw new NotFoundError('Receptionist record not found.');
    }
    return typeof receptionist.toJSON === 'function' ? receptionist.toJSON() : receptionist;
  }

  public async updateReceptionist(id: string, input: UpdateReceptionistInput, actor?: ActivityActor) {
    const receptionist = await this.receptionistRepository.findById(id);
    if (!receptionist) {
      throw new NotFoundError('Receptionist record not found.');
    }

    const updatedReceptionist = await this.receptionistRepository.update(id, input);

    if (receptionist.userId) {
      const userUpdate: any = {};
      if (input.name) userUpdate.name = input.name;
      if (input.email) userUpdate.email = input.email.toLowerCase();
      if (input.phone) userUpdate.phone = input.phone;
      if (input.avatar) userUpdate.avatar = input.avatar;
      if (input.status) userUpdate.status = input.status;
      if (Object.keys(userUpdate).length > 0) {
        await this.userRepository.update((receptionist.userId as any).id || (receptionist.userId as any).toString(), userUpdate);
      }
    }

    const result = updatedReceptionist ? (typeof updatedReceptionist.toJSON === 'function' ? updatedReceptionist.toJSON() : updatedReceptionist) : null;
    await logActivity(actor, 'updated', 'Receptionist', updatedReceptionist?.name || receptionist.name);
    return result;
  }

  public async deleteReceptionist(id: string, actor?: ActivityActor) {
    const receptionist = await this.receptionistRepository.findById(id);
    if (!receptionist) {
      throw new NotFoundError('Receptionist record not found.');
    }

    await this.receptionistRepository.softDelete(id);
    if (receptionist.userId) {
      await this.userRepository.softDelete((receptionist.userId as any).id || (receptionist.userId as any).toString());
    }

    await logActivity(actor, 'deleted', 'Receptionist', receptionist.name);
  }
}
