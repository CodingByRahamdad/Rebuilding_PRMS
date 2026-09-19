import { Router } from 'express';
import { DoctorController } from './doctors.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import {
  createDoctorSchema,
  updateDoctorSchema,
  getDoctorsQuerySchema,
  doctorIdParamSchema,
} from './doctors.validation';

const doctorRouter = Router();
const doctorController = new DoctorController();

doctorRouter.use(authenticate);

doctorRouter.post('/', authorize('Super Admin', 'Receptionist'), validate(createDoctorSchema), doctorController.createDoctor);
doctorRouter.get('/', validate(getDoctorsQuerySchema), doctorController.getDoctors);
doctorRouter.get('/:id', validate(doctorIdParamSchema), doctorController.getDoctorById);
doctorRouter.put('/:id', authorize('Super Admin', 'Doctor'), validate(updateDoctorSchema), doctorController.updateDoctor);
doctorRouter.delete('/:id', authorize('Super Admin'), validate(doctorIdParamSchema), doctorController.deleteDoctor);

export default doctorRouter;
