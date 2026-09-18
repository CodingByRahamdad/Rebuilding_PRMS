import { Router } from 'express';
import { ApiResponse } from '../shared/utils/api-response';
import { dbConnection } from '../shared/database/connection';
import authRouter from '../modules/auth/auth.routes';
import userRouter from '../modules/users/users.routes';
import doctorRouter from '../modules/doctors/doctors.routes';
import nurseRouter from '../modules/nurses/nurses.routes';
import receptionistRouter from '../modules/receptionists/receptionists.routes';
import patientRouter from '../modules/patients/patients.routes';
import appointmentRouter from '../modules/appointments/appointments.routes';
import medicalRecordRouter from '../modules/medical-records/medical-records.routes';
import paymentRouter from '../modules/payments/payments.routes';
import serviceRouter from '../modules/services/services.routes';
import analyticsRouter from '../modules/analytics/analytics.routes';

const apiRouter = Router();

// API Health Check Endpoint
apiRouter.get('/health', (req, res) => {
  const dbStatus = dbConnection.getStatus();
  const isProduction = process.env.ENABLE_DEMO_MODE === 'false';
  const isHealthy = !isProduction || dbStatus.isConnected;

  ApiResponse.success(
    res,
    {
      status: isHealthy ? 'OK' : 'DEGRADED',
      database: {
        connected: dbStatus.isConnected,
        status: dbStatus.stateName,
        mode: dbStatus.mode,
      },
      version: 'v1',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    isHealthy
      ? 'Patient Record Management System API v1 is healthy'
      : 'Database connection unavailable in production mode'
  );
});

// System Configuration Endpoint
apiRouter.get('/config', (req, res) => {
  ApiResponse.success(
    res,
    {
      enableDemoMode: process.env.ENABLE_DEMO_MODE !== 'false',
    },
    'System configuration retrieved'
  );
});

// Module Routes
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/doctors', doctorRouter);
apiRouter.use('/nurses', nurseRouter);
apiRouter.use('/receptionists', receptionistRouter);
apiRouter.use('/patients', patientRouter);
apiRouter.use('/appointments', appointmentRouter);
apiRouter.use('/medical-records', medicalRecordRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/services', serviceRouter);
apiRouter.use('/analytics', analyticsRouter);

export default apiRouter;

