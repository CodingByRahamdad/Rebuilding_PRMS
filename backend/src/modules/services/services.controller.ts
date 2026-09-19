import { Request, Response } from 'express';
import { MedicalServicesService } from './services.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HttpStatus } from '../../shared/constants/http-status';

export class ServiceController {
  private serviceService: MedicalServicesService;

  constructor() {
    this.serviceService = new MedicalServicesService();
  }

  public createService = asyncHandler(async (req: Request, res: Response) => {
    const service = await this.serviceService.createService(req.body, req.user);
    return ApiResponse.created(res, service, 'Medical service added successfully');
  });

  public getServices = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.serviceService.getServices(req.query as any);
    return ApiResponse.paginated(res, result.services, result.meta, 'Medical services fetched successfully');
  });

  public getServiceById = asyncHandler(async (req: Request, res: Response) => {
    const service = await this.serviceService.getServiceById(req.params.id);
    return ApiResponse.success(res, service, 'Medical service details fetched successfully', HttpStatus.OK);
  });

  public updateService = asyncHandler(async (req: Request, res: Response) => {
    const service = await this.serviceService.updateService(req.params.id, req.body, req.user);
    return ApiResponse.success(res, service, 'Medical service updated successfully', HttpStatus.OK);
  });

  public deleteService = asyncHandler(async (req: Request, res: Response) => {
    await this.serviceService.deleteService(req.params.id, req.user);
    return ApiResponse.success(res, null, 'Medical service deleted successfully', HttpStatus.OK);
  });
}
