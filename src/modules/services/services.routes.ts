import { Router } from 'express';
import { ServiceController } from './services.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import {
  createServiceSchema,
  updateServiceSchema,
  getServicesQuerySchema,
  serviceIdParamSchema,
} from './services.validation';

const serviceRouter = Router();
const serviceController = new ServiceController();

serviceRouter.use(authenticate);

serviceRouter.post('/', authorize('Super Admin'), validate(createServiceSchema), serviceController.createService);
serviceRouter.get('/', validate(getServicesQuerySchema), serviceController.getServices);
serviceRouter.get('/:id', validate(serviceIdParamSchema), serviceController.getServiceById);
serviceRouter.put('/:id', authorize('Super Admin'), validate(updateServiceSchema), serviceController.updateService);
serviceRouter.delete('/:id', authorize('Super Admin'), validate(serviceIdParamSchema), serviceController.deleteService);

export default serviceRouter;
