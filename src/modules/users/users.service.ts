import { UserRepository } from './users.repository';
import { CreateUserInput, UpdateUserInput, GetUserQuery } from './users.validation';
import { AuthUtils } from '../auth/auth.utils';
import { ConflictError, NotFoundError, BadRequestError } from '../../shared/errors/app-error';
import { DoctorModel } from '../doctors/models/doctor.model';
import { NurseModel } from '../nurses/models/nurse.model';
import { ReceptionistModel } from '../receptionists/models/receptionist.model';
import { PatientModel } from '../patients/models/patient.model';
import { isDbConnected } from '../../shared/database/db-guard';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  public async createUser(input: CreateUserInput) {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError(`User with email '${input.email}' already exists.`);
    }

    const passwordHash = await AuthUtils.hashPassword(input.password);

    const newUser = await this.userRepository.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role,
      phone: input.phone,
      avatar: input.avatar || '',
      status: input.status || 'Active',
    });

    return newUser.toJSON();
  }

  public async getUsers(query: GetUserQuery) {
    const result = await this.userRepository.findAll(query);
    return {
      users: result.users.map((user) => user.toJSON()),
      meta: result.meta,
    };
  }

  public async getUserById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found.');
    }
    return user.toJSON();
  }

  public async updateUser(id: string, input: UpdateUserInput) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    if (input.email && input.email.toLowerCase() !== user.email) {
      const existingEmail = await this.userRepository.findByEmail(input.email);
      if (existingEmail) {
        throw new ConflictError(`Email '${input.email}' is already in use.`);
      }
    }

    const updateData: any = { ...input };
    if (input.password) {
      updateData.passwordHash = await AuthUtils.hashPassword(input.password);
      delete updateData.password;
    }

    const updatedUser = await this.userRepository.update(id, updateData);

    // Bidirectional sync to staff/patient models if name, email, phone, avatar or status changed
    const syncData: any = {};
    if (input.name) syncData.name = input.name;
    if (input.email) syncData.email = input.email.toLowerCase();
    if (input.phone) syncData.phone = input.phone;
    if (input.avatar) syncData.avatar = input.avatar;
    if (input.status) syncData.status = input.status;

    if (Object.keys(syncData).length > 0 && isDbConnected()) {
      try {
        await Promise.all([
          DoctorModel.updateOne({ userId: id }, { $set: syncData }).exec(),
          NurseModel.updateOne({ userId: id }, { $set: syncData }).exec(),
          ReceptionistModel.updateOne({ userId: id }, { $set: syncData }).exec(),
          PatientModel.updateOne({ userId: id }, { $set: syncData }).exec(),
        ]);
      } catch (err) {
        console.warn('⚠️ Staff sync on user update note:', err);
      }
    }

    return updatedUser?.toJSON();
  }

  public async deleteUser(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestError('You cannot delete your own account.');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    await this.userRepository.softDelete(id);
  }
}
