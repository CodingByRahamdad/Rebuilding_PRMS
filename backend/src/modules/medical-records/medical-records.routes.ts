import { Router } from 'express';
import { MedicalRecordController } from './medical-records.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import {
  createMedicalRecordSchema,
  updateMedicalRecordSchema,
  getMedicalRecordsQuerySchema,
  medicalRecordIdParamSchema,
} from './medical-records.validation';

const medicalRecordRouter = Router();
const medicalRecordController = new MedicalRecordController();

medicalRecordRouter.use(authenticate);

medicalRecordRouter.post('/', authorize('Super Admin', 'Doctor', 'Nurse'), validate(createMedicalRecordSchema), medicalRecordController.createMedicalRecord);
medicalRecordRouter.get('/', validate(getMedicalRecordsQuerySchema), medicalRecordController.getMedicalRecords);
medicalRecordRouter.get('/:id', validate(medicalRecordIdParamSchema), medicalRecordController.getMedicalRecordById);
medicalRecordRouter.put('/:id', authorize('Super Admin', 'Doctor'), validate(updateMedicalRecordSchema), medicalRecordController.updateMedicalRecord);
medicalRecordRouter.delete('/:id', authorize('Super Admin', 'Doctor'), validate(medicalRecordIdParamSchema), medicalRecordController.deleteMedicalRecord);

export default medicalRecordRouter;
