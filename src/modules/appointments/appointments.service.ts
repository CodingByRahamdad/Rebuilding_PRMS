import { AppointmentRepository } from './appointments.repository';
import { PatientRepository } from '../patients/patients.repository';
import { DoctorRepository } from '../doctors/doctors.repository';
import { CreateAppointmentInput, UpdateAppointmentInput, GetAppointmentsQuery } from './appointments.validation';
import { NotFoundError } from '../../shared/errors/app-error';
import { logActivity, ActivityActor } from '../../shared/utils/activity-logger';

export class AppointmentService {
  private appointmentRepository: AppointmentRepository;
  private patientRepository: PatientRepository;
  private doctorRepository: DoctorRepository;

  constructor() {
    this.appointmentRepository = new AppointmentRepository();
    this.patientRepository = new PatientRepository();
    this.doctorRepository = new DoctorRepository();
  }

  public async createAppointment(input: CreateAppointmentInput, actor?: ActivityActor) {
    // Optionally resolve patient & doctor details if exists
    let patientName = input.patientName;
    let doctorName = input.doctorName;

    if (input.patientId) {
      const patient = await this.patientRepository.findById(input.patientId);
      if (patient) patientName = patient.name;
    }

    if (input.doctorId) {
      const doctor = await this.doctorRepository.findById(input.doctorId);
      if (doctor) doctorName = doctor.name;
    }

    const appointment = await this.appointmentRepository.create({
      patientId: input.patientId || `PT-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName,
      doctorId: input.doctorId || `doc-${Math.floor(100 + Math.random() * 900)}`,
      doctorName,
      department: input.department,
      date: input.date,
      time: input.time,
      type: input.type || 'In-Person',
      status: input.status || 'Pending',
      symptoms: input.symptoms || '',
      notes: input.notes || '',
    });

    const result = typeof (appointment as any)?.toJSON === 'function' ? appointment.toJSON() : appointment;
    await logActivity(actor, 'created', 'Appointment', `${patientName} with Dr. ${doctorName}`);
    return result;
  }

  public async getAppointments(query: GetAppointmentsQuery) {
    const result = await this.appointmentRepository.findAll(query);
    return {
      appointments: result.appointments.map((a: any) =>
        typeof a?.toJSON === 'function' ? a.toJSON() : { ...a, id: a.id || a._id?.toString() || a._id }
      ),
      meta: result.meta,
    };
  }

  public async getAppointmentById(id: string) {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new NotFoundError('Appointment record not found.');
    }
    return typeof (appointment as any)?.toJSON === 'function' ? appointment.toJSON() : appointment;
  }

  public async updateAppointment(id: string, input: UpdateAppointmentInput, actor?: ActivityActor) {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new NotFoundError('Appointment record not found.');
    }

    const updatedAppointment = await this.appointmentRepository.update(id, input);
    const result = typeof (updatedAppointment as any)?.toJSON === 'function' ? updatedAppointment.toJSON() : updatedAppointment;
    await logActivity(actor, 'updated', 'Appointment', `${appointment.patientName} (${id})`);
    return result;
  }

  public async deleteAppointment(id: string, actor?: ActivityActor) {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new NotFoundError('Appointment record not found.');
    }

    await this.appointmentRepository.softDelete(id);
    await logActivity(actor, 'deleted', 'Appointment', `${appointment.patientName} (${id})`);
  }
}
