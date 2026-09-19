import { Request, Response } from 'express';
import { PaymentService } from './payments.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HttpStatus } from '../../shared/constants/http-status';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  public createPayment = asyncHandler(async (req: Request, res: Response) => {
    const payment = await this.paymentService.createPayment(req.body, req.user);
    return ApiResponse.created(res, payment, 'Payment invoice created successfully');
  });

  public getPayments = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.paymentService.getPayments(req.query as any);
    return ApiResponse.paginated(res, result.payments, result.meta, 'Payment records retrieved successfully');
  });

  public getPaymentById = asyncHandler(async (req: Request, res: Response) => {
    const payment = await this.paymentService.getPaymentById(req.params.id);
    return ApiResponse.success(res, payment, 'Payment details retrieved successfully', HttpStatus.OK);
  });

  public updatePayment = asyncHandler(async (req: Request, res: Response) => {
    const payment = await this.paymentService.updatePayment(req.params.id, req.body, req.user);
    return ApiResponse.success(res, payment, 'Payment record updated successfully', HttpStatus.OK);
  });

  public deletePayment = asyncHandler(async (req: Request, res: Response) => {
    await this.paymentService.deletePayment(req.params.id, req.user);
    return ApiResponse.success(res, null, 'Payment record deleted successfully', HttpStatus.OK);
  });
}
