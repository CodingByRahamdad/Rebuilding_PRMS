import { Router } from 'express';
import { NurseController } from './nurses.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import {
  createNurseSchema,
  updateNurseSchema,
  getNursesQuerySchema,
  nurseIdParamSchema,
} from './nurses.validation';

const nurseRouter = Router();
const nurseController = new NurseController();

nurseRouter.use(authenticate);

nurseRouter.post('/', authorize('Super Admin', 'Receptionist'), validate(createNurseSchema), nurseController.createNurse);
nurseRouter.get('/', validate(getNursesQuerySchema), nurseController.getNurses);
nurseRouter.get('/:id', validate(nurseIdParamSchema), nurseController.getNurseById);
nurseRouter.put('/:id', authorize('Super Admin', 'Nurse'), validate(updateNurseSchema), nurseController.updateNurse);
nurseRouter.delete('/:id', authorize('Super Admin'), validate(nurseIdParamSchema), nurseController.deleteNurse);

export default nurseRouter;
