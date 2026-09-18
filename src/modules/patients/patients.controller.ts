import { Request, Response } from 'express';
import { PatientService } from './patients.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HttpStatus } from '../../shared/constants/http-status';

export class PatientController {
  private patientService: PatientService;

  constructor() {
    this.patientService = new PatientService();
  }

  public createPatient = asyncHandler(async (req: Request, res: Response) => {
    const patient = await this.patientService.createPatient(req.body, req.user);
    return ApiResponse.created(res, patient, 'Patient registered successfully');
  });

  public getPatients = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.patientService.getPatients(req.query as any);
    return ApiResponse.paginated(res, result.patients, result.meta, 'Patient records retrieved successfully');
  });

  public getPatientById = asyncHandler(async (req: Request, res: Response) => {
    const patient = await this.patientService.getPatientById(req.params.id);
    return ApiResponse.success(res, patient, 'Patient details retrieved successfully', HttpStatus.OK);
  });

  public updatePatient = asyncHandler(async (req: Request, res: Response) => {
    const patient = await this.patientService.updatePatient(req.params.id, req.body, req.user);
    return ApiResponse.success(res, patient, 'Patient profile updated successfully', HttpStatus.OK);
  });

  public deletePatient = asyncHandler(async (req: Request, res: Response) => {
    await this.patientService.deletePatient(req.params.id, req.user);
    return ApiResponse.success(res, null, 'Patient record deleted successfully', HttpStatus.OK);
  });
}
