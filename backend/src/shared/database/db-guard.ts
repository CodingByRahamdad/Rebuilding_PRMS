import mongoose from 'mongoose';
import { DatabaseUnavailableError } from '../errors/app-error';

export const isDbConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export const isDemoModeEnabled = (): boolean => {
  return process.env.ENABLE_DEMO_MODE !== 'false';
};

/**
 * Asserts that the database is available if running in production mode.
 * Throws DatabaseUnavailableError (503) if MongoDB is not connected in production mode.
 */
export const assertDatabaseConnection = (): void => {
  if (!isDemoModeEnabled() && !isDbConnected()) {
    throw new DatabaseUnavailableError(
      'Database service is unavailable. MongoDB connection is required in production mode.'
    );
  }
};
