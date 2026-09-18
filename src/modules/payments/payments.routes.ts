import { Router } from 'express';
import { PaymentController } from './payments.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import {
  createPaymentSchema,
  updatePaymentSchema,
  getPaymentsQuerySchema,
  paymentIdParamSchema,
} from './payments.validation';

const paymentRouter = Router();
const paymentController = new PaymentController();

paymentRouter.use(authenticate);

paymentRouter.post('/', authorize('Super Admin', 'Receptionist'), validate(createPaymentSchema), paymentController.createPayment);
paymentRouter.get('/', validate(getPaymentsQuerySchema), paymentController.getPayments);
paymentRouter.get('/:id', validate(paymentIdParamSchema), paymentController.getPaymentById);
paymentRouter.put('/:id', authorize('Super Admin', 'Receptionist'), validate(updatePaymentSchema), paymentController.updatePayment);
paymentRouter.delete('/:id', authorize('Super Admin'), validate(paymentIdParamSchema), paymentController.deletePayment);

export default paymentRouter;
