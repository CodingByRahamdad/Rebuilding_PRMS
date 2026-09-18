import { Request, Response } from 'express';
import { NurseService } from './nurses.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HttpStatus } from '../../shared/constants/http-status';

export class NurseController {
  private nurseService: NurseService;

  constructor() {
    this.nurseService = new NurseService();
  }

  public createNurse = asyncHandler(async (req: Request, res: Response) => {
    const nurse = await this.nurseService.createNurse(req.body, req.user);
    return ApiResponse.created(res, nurse, 'Nurse profile registered successfully');
  });

  public getNurses = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.nurseService.getNurses(req.query as any);
    return ApiResponse.paginated(res, result.nurses, result.meta, 'Nurse records retrieved successfully');
  });

  public getNurseById = asyncHandler(async (req: Request, res: Response) => {
    const nurse = await this.nurseService.getNurseById(req.params.id);
    return ApiResponse.success(res, nurse, 'Nurse details retrieved successfully', HttpStatus.OK);
  });

  public updateNurse = asyncHandler(async (req: Request, res: Response) => {
    const nurse = await this.nurseService.updateNurse(req.params.id, req.body, req.user);
    return ApiResponse.success(res, nurse, 'Nurse profile updated successfully', HttpStatus.OK);
  });

  public deleteNurse = asyncHandler(async (req: Request, res: Response) => {
    await this.nurseService.deleteNurse(req.params.id, req.user);
    return ApiResponse.success(res, null, 'Nurse profile deleted successfully', HttpStatus.OK);
  });
}
