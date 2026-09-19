import { Request, Response } from 'express';
import { MedicalRecordService } from './medical-records.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HttpStatus } from '../../shared/constants/http-status';

export class MedicalRecordController {
  private medicalRecordService: MedicalRecordService;

  constructor() {
    this.medicalRecordService = new MedicalRecordService();
  }

  public createMedicalRecord = asyncHandler(async (req: Request, res: Response) => {
    const record = await this.medicalRecordService.createMedicalRecord(req.body, req.user);
    return ApiResponse.created(res, record, 'Medical record created successfully');
  });

  public getMedicalRecords = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.medicalRecordService.getMedicalRecords(req.query as any);
    return ApiResponse.paginated(res, result.records, result.meta, 'Medical records fetched successfully');
  });

  public getMedicalRecordById = asyncHandler(async (req: Request, res: Response) => {
    const record = await this.medicalRecordService.getMedicalRecordById(req.params.id);
    return ApiResponse.success(res, record, 'Medical record details fetched successfully', HttpStatus.OK);
  });

  public updateMedicalRecord = asyncHandler(async (req: Request, res: Response) => {
    const record = await this.medicalRecordService.updateMedicalRecord(req.params.id, req.body, req.user);
    return ApiResponse.success(res, record, 'Medical record updated successfully', HttpStatus.OK);
  });

  public deleteMedicalRecord = asyncHandler(async (req: Request, res: Response) => {
    await this.medicalRecordService.deleteMedicalRecord(req.params.id, req.user);
    return ApiResponse.success(res, null, 'Medical record deleted successfully', HttpStatus.OK);
  });
}
