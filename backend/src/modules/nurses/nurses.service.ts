import { NurseRepository } from './nurses.repository';
import { UserRepository } from '../users/users.repository';
import { CreateNurseInput, UpdateNurseInput, GetNursesQuery } from './nurses.validation';
import { AuthUtils } from '../auth/auth.utils';
import { ConflictError, NotFoundError } from '../../shared/errors/app-error';
import { logActivity, ActivityActor } from '../../shared/utils/activity-logger';

export class NurseService {
  private nurseRepository: NurseRepository;
  private userRepository: UserRepository;

  constructor() {
    this.nurseRepository = new NurseRepository();
    this.userRepository = new UserRepository();
  }

  public async createNurse(input: CreateNurseInput, actor?: ActivityActor) {
    const existingLicense = await this.nurseRepository.findByLicenseNumber(input.licenseNumber);
    if (existingLicense) {
      throw new ConflictError(`Nurse with license number '${input.licenseNumber}' already exists.`);
    }

    const existingUser = await this.userRepository.findByEmail(input.email);
    let userId: string;

    if (existingUser) {
      userId = existingUser._id.toString();
    } else {
      const passwordHash = await AuthUtils.hashPassword(input.password || 'NursePass123!');
      const newUser = await this.userRepository.create({
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        role: 'Nurse',
        phone: input.phone,
        avatar: input.avatar || '',
        status: input.status || 'Active',
      });
      userId = newUser._id.toString();
    }

    const nurse = await this.nurseRepository.create({
      userId: userId as any,
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      address: input.address || '',
      avatar: input.avatar || '',
      department: input.department,
      shift: input.shift,
      licenseNumber: input.licenseNumber,
      assignedWard: input.assignedWard,
      patientLoad: input.patientLoad || (input.assignedPatientIds ? input.assignedPatientIds.length : 0),
      assignedPatientIds: input.assignedPatientIds || [],
      status: input.status || 'Active',
    });

    const result = nurse.toJSON();
    await logActivity(actor, 'created', 'Nurse', nurse.name);
    return result;
  }

  public async getNurses(query: GetNursesQuery) {
    const result = await this.nurseRepository.findAll(query);
    return {
      nurses: result.nurses.map((n) => n.toJSON()),
      meta: result.meta,
    };
  }

  public async getNurseById(id: string) {
    const nurse = await this.nurseRepository.findById(id);
    if (!nurse) {
      throw new NotFoundError('Nurse record not found.');
    }
    return nurse.toJSON();
  }

  public async updateNurse(id: string, input: UpdateNurseInput, actor?: ActivityActor) {
    const nurse = await this.nurseRepository.findById(id);
    if (!nurse) {
      throw new NotFoundError('Nurse record not found.');
    }

    if (input.licenseNumber && input.licenseNumber !== nurse.licenseNumber) {
      const existingLicense = await this.nurseRepository.findByLicenseNumber(input.licenseNumber);
      if (existingLicense) {
        throw new ConflictError(`License number '${input.licenseNumber}' is already registered.`);
      }
    }

    const updatedNurse = await this.nurseRepository.update(id, input);

    if (nurse.userId) {
      const userUpdate: any = {};
      if (input.name) userUpdate.name = input.name;
      if (input.email) userUpdate.email = input.email.toLowerCase();
      if (input.phone) userUpdate.phone = input.phone;
      if (input.avatar) userUpdate.avatar = input.avatar;
      if (input.status) userUpdate.status = input.status;
      if (Object.keys(userUpdate).length > 0) {
        await this.userRepository.update((nurse.userId as any).id || (nurse.userId as any).toString(), userUpdate);
      }
    }

    const result = updatedNurse?.toJSON();
    await logActivity(actor, 'updated', 'Nurse', updatedNurse?.name || nurse.name);
    return result;
  }

  public async deleteNurse(id: string, actor?: ActivityActor) {
    const nurse = await this.nurseRepository.findById(id);
    if (!nurse) {
      throw new NotFoundError('Nurse record not found.');
    }

    await this.nurseRepository.softDelete(id);
    if (nurse.userId) {
      await this.userRepository.softDelete((nurse.userId as any).id || (nurse.userId as any).toString());
    }

    await logActivity(actor, 'deleted', 'Nurse', nurse.name);
  }
}
