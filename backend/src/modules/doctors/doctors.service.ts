import { DoctorRepository } from './doctors.repository';
import { UserRepository } from '../users/users.repository';
import { CreateDoctorInput, UpdateDoctorInput, GetDoctorsQuery } from './doctors.validation';
import { AuthUtils } from '../auth/auth.utils';
import { ConflictError, NotFoundError } from '../../shared/errors/app-error';
import { logActivity, ActivityActor } from '../../shared/utils/activity-logger';

export class DoctorService {
  private doctorRepository: DoctorRepository;
  private userRepository: UserRepository;

  constructor() {
    this.doctorRepository = new DoctorRepository();
    this.userRepository = new UserRepository();
  }

  public async createDoctor(input: CreateDoctorInput, actor?: ActivityActor) {
    const existingLicense = await this.doctorRepository.findByLicenseNumber(input.licenseNumber);
    if (existingLicense) {
      throw new ConflictError(`Doctor with license number '${input.licenseNumber}' already exists.`);
    }

    const existingUser = await this.userRepository.findByEmail(input.email);
    let userId: string;

    if (existingUser) {
      userId = existingUser._id.toString();
    } else {
      const passwordHash = await AuthUtils.hashPassword(input.password || 'DoctorPass123!');
      const newUser = await this.userRepository.create({
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        role: 'Doctor',
        phone: input.phone,
        avatar: input.avatar || '',
        status: input.status || 'Active',
      });
      userId = newUser._id.toString();
    }

    const doctor = await this.doctorRepository.create({
      userId: userId as any,
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      avatar: input.avatar || '',
      age: input.age,
      address: input.address || '',
      specialization: input.specialization,
      department: input.department,
      licenseNumber: input.licenseNumber,
      experience: input.experience,
      consultationFee: input.consultationFee,
      availability: input.availability || 'Mon-Fri, 09:00 AM - 05:00 PM',
      status: input.status || 'Active',
    });

    const result = doctor.toJSON();
    await logActivity(actor, 'created', 'Doctor', doctor.name);
    return result;
  }

  public async getDoctors(query: GetDoctorsQuery) {
    const result = await this.doctorRepository.findAll(query);
    return {
      doctors: result.doctors.map((d) => d.toJSON()),
      meta: result.meta,
    };
  }

  public async getDoctorById(id: string) {
    const doctor = await this.doctorRepository.findById(id);
    if (!doctor) {
      throw new NotFoundError('Doctor record not found.');
    }
    return doctor.toJSON();
  }

  public async updateDoctor(id: string, input: UpdateDoctorInput, actor?: ActivityActor) {
    const doctor = await this.doctorRepository.findById(id);
    if (!doctor) {
      throw new NotFoundError('Doctor record not found.');
    }

    if (input.licenseNumber && input.licenseNumber !== doctor.licenseNumber) {
      const existingLicense = await this.doctorRepository.findByLicenseNumber(input.licenseNumber);
      if (existingLicense) {
        throw new ConflictError(`License number '${input.licenseNumber}' is already registered.`);
      }
    }

    const updatedDoctor = await this.doctorRepository.update(id, input);
    
    // Synchronize User table if name, email, phone, avatar or status changed
    if (doctor.userId) {
      const userUpdate: any = {};
      if (input.name) userUpdate.name = input.name;
      if (input.email) userUpdate.email = input.email.toLowerCase();
      if (input.phone) userUpdate.phone = input.phone;
      if (input.avatar) userUpdate.avatar = input.avatar;
      if (input.status) userUpdate.status = input.status;
      if (Object.keys(userUpdate).length > 0) {
        await this.userRepository.update((doctor.userId as any).id || (doctor.userId as any).toString(), userUpdate);
      }
    }

    const result = updatedDoctor?.toJSON();
    await logActivity(actor, 'updated', 'Doctor', updatedDoctor?.name || doctor.name);
    return result;
  }

  public async deleteDoctor(id: string, actor?: ActivityActor) {
    const doctor = await this.doctorRepository.findById(id);
    if (!doctor) {
      throw new NotFoundError('Doctor record not found.');
    }

    await this.doctorRepository.softDelete(id);
    if (doctor.userId) {
      await this.userRepository.softDelete((doctor.userId as any).id || (doctor.userId as any).toString());
    }

    await logActivity(actor, 'deleted', 'Doctor', doctor.name);
  }
}
