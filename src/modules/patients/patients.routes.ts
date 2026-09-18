import { Router } from 'express';
import { PatientController } from './patients.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import {
  createPatientSchema,
  updatePatientSchema,
  getPatientsQuerySchema,
  patientIdParamSchema,
} from './patients.validation';

const patientRouter = Router();
const patientController = new PatientController();

patientRouter.use(authenticate);

patientRouter.post('/', authorize('Super Admin', 'Receptionist', 'Nurse'), validate(createPatientSchema), patientController.createPatient);
patientRouter.get('/', validate(getPatientsQuerySchema), patientController.getPatients);
patientRouter.get('/:id', validate(patientIdParamSchema), patientController.getPatientById);
patientRouter.put('/:id', authorize('Super Admin', 'Receptionist', 'Nurse', 'Doctor'), validate(updatePatientSchema), patientController.updatePatient);
patientRouter.delete('/:id', authorize('Super Admin'), validate(patientIdParamSchema), patientController.deletePatient);

export default patientRouter;
