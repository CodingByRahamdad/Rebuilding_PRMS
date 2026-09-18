import { Router } from 'express';
import { ReceptionistController } from './receptionists.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import {
  createReceptionistSchema,
  updateReceptionistSchema,
  getReceptionistsQuerySchema,
  receptionistIdParamSchema,
} from './receptionists.validation';

const receptionistRouter = Router();
const receptionistController = new ReceptionistController();

receptionistRouter.use(authenticate);

receptionistRouter.post('/', authorize('Super Admin'), validate(createReceptionistSchema), receptionistController.createReceptionist);
receptionistRouter.get('/', validate(getReceptionistsQuerySchema), receptionistController.getReceptionists);
receptionistRouter.get('/:id', validate(receptionistIdParamSchema), receptionistController.getReceptionistById);
receptionistRouter.put('/:id', authorize('Super Admin', 'Receptionist'), validate(updateReceptionistSchema), receptionistController.updateReceptionist);
receptionistRouter.delete('/:id', authorize('Super Admin'), validate(receptionistIdParamSchema), receptionistController.deleteReceptionist);

export default receptionistRouter;
