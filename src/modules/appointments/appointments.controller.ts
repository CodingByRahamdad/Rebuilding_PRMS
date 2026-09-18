import { Request, Response } from 'express';
import { AppointmentService } from './appointments.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HttpStatus } from '../../shared/constants/http-status';

export class AppointmentController {
  private appointmentService: AppointmentService;

  constructor() {
    this.appointmentService = new AppointmentService();
  }

  public createAppointment = asyncHandler(async (req: Request, res: Response) => {
    const appointment = await this.appointmentService.createAppointment(req.body, req.user);
    return ApiResponse.created(res, appointment, 'Appointment scheduled successfully');
  });

  public getAppointments = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.appointmentService.getAppointments(req.query as any);
    return ApiResponse.paginated(res, result.appointments, result.meta, 'Appointments retrieved successfully');
  });

  public getAppointmentById = asyncHandler(async (req: Request, res: Response) => {
    const appointment = await this.appointmentService.getAppointmentById(req.params.id);
    return ApiResponse.success(res, appointment, 'Appointment details fetched successfully', HttpStatus.OK);
  });

  public updateAppointment = asyncHandler(async (req: Request, res: Response) => {
    const appointment = await this.appointmentService.updateAppointment(req.params.id, req.body, req.user);
    return ApiResponse.success(res, appointment, 'Appointment updated successfully', HttpStatus.OK);
  });

  public deleteAppointment = asyncHandler(async (req: Request, res: Response) => {
    await this.appointmentService.deleteAppointment(req.params.id, req.user);
    return ApiResponse.success(res, null, 'Appointment cancelled/deleted successfully', HttpStatus.OK);
  });
}
