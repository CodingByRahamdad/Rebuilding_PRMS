import { Request, Response } from 'express';
import { ReceptionistService } from './receptionists.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HttpStatus } from '../../shared/constants/http-status';

export class ReceptionistController {
  private receptionistService: ReceptionistService;

  constructor() {
    this.receptionistService = new ReceptionistService();
  }

  public createReceptionist = asyncHandler(async (req: Request, res: Response) => {
    const receptionist = await this.receptionistService.createReceptionist(req.body, req.user);
    return ApiResponse.created(res, receptionist, 'Receptionist profile registered successfully');
  });

  public getReceptionists = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.receptionistService.getReceptionists(req.query as any);
    return ApiResponse.paginated(res, result.receptionists, result.meta, 'Receptionist records retrieved successfully');
  });

  public getReceptionistById = asyncHandler(async (req: Request, res: Response) => {
    const receptionist = await this.receptionistService.getReceptionistById(req.params.id);
    return ApiResponse.success(res, receptionist, 'Receptionist details retrieved successfully', HttpStatus.OK);
  });

  public updateReceptionist = asyncHandler(async (req: Request, res: Response) => {
    const receptionist = await this.receptionistService.updateReceptionist(req.params.id, req.body, req.user);
    return ApiResponse.success(res, receptionist, 'Receptionist profile updated successfully', HttpStatus.OK);
  });

  public deleteReceptionist = asyncHandler(async (req: Request, res: Response) => {
    await this.receptionistService.deleteReceptionist(req.params.id, req.user);
    return ApiResponse.success(res, null, 'Receptionist profile deleted successfully', HttpStatus.OK);
  });
}
