import { Request, Response } from 'express';
import { DoctorService } from './doctors.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HttpStatus } from '../../shared/constants/http-status';

export class DoctorController {
  private doctorService: DoctorService;

  constructor() {
    this.doctorService = new DoctorService();
  }

  public createDoctor = asyncHandler(async (req: Request, res: Response) => {
    const doctor = await this.doctorService.createDoctor(req.body, req.user);
    return ApiResponse.created(res, doctor, 'Doctor profile registered successfully');
  });

  public getDoctors = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.doctorService.getDoctors(req.query as any);
    return ApiResponse.paginated(res, result.doctors, result.meta, 'Doctor records retrieved successfully');
  });

  public getDoctorById = asyncHandler(async (req: Request, res: Response) => {
    const doctor = await this.doctorService.getDoctorById(req.params.id);
    return ApiResponse.success(res, doctor, 'Doctor details retrieved successfully', HttpStatus.OK);
  });

  public updateDoctor = asyncHandler(async (req: Request, res: Response) => {
    const doctor = await this.doctorService.updateDoctor(req.params.id, req.body, req.user);
    return ApiResponse.success(res, doctor, 'Doctor profile updated successfully', HttpStatus.OK);
  });

  public deleteDoctor = asyncHandler(async (req: Request, res: Response) => {
    await this.doctorService.deleteDoctor(req.params.id, req.user);
    return ApiResponse.success(res, null, 'Doctor profile deleted successfully', HttpStatus.OK);
  });
}
