import mongoose from 'mongoose';
import { env } from '../config/env.config';

// Disable Mongoose query buffering globally so operations never hang or timeout after 10000ms
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 1000);

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected = false;

  private constructor() {
    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      console.log('✅ MongoDB database connection established successfully.');
    });

    mongoose.connection.on('error', (err) => {
      this.isConnected = false;
      console.error('❌ MongoDB connection error:', err?.message || err);
    });

    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      console.warn('⚠️ MongoDB connection disconnected.');
    });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected && mongoose.connection.readyState === 1) {
      console.log('ℹ️ MongoDB is already connected.');
      return;
    }

    try {
      const isProduction = process.env.ENABLE_DEMO_MODE === 'false';
      const targetDbName = isProduction ? 'prms_production' : 'prms_demo';
      const uri = env.MONGODB_URI;
      console.log(`🔌 Attempting connection to MongoDB [DB: ${targetDbName}] at: ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
      await mongoose.connect(uri, {
        dbName: targetDbName,
        autoIndex: env.NODE_ENV !== 'production',
        serverSelectionTimeoutMS: 3000,
      });
      this.isConnected = true;
      if (isProduction) {
        console.log(`✅ MongoDB database connection established successfully in PRODUCTION mode (DB: ${targetDbName}).`);
      } else {
        console.log(`✅ MongoDB database connection established successfully in DEMO mode (DB: ${targetDbName}).`);
      }
    } catch (error: any) {
      this.isConnected = false;
      const isProduction = process.env.ENABLE_DEMO_MODE === 'false';
      if (isProduction) {
        console.error('❌ MongoDB database connection FAILED in PRODUCTION mode. Database is mandatory when ENABLE_DEMO_MODE=false:', error?.message || error);
      } else {
        console.warn('⚠️ Could not establish connection to MongoDB. Running in DEMO / in-memory fallback mode:', error?.message || error);
      }
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('🔌 MongoDB connection closed gracefully.');
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
    }
  }

  public getStatus(): { isConnected: boolean; readyState: number; stateName: string; mode: string } {
    const readyStateNames: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
      99: 'uninitialized',
    };
    const stateIndex = mongoose.connection.readyState;
    const isConnected = stateIndex === 1;
    const isDemo = process.env.ENABLE_DEMO_MODE !== 'false';
    return {
      isConnected,
      readyState: stateIndex,
      stateName: readyStateNames[stateIndex] || 'unknown',
      mode: isDemo ? 'demo' : 'production',
    };
  }
}

export const dbConnection = DatabaseConnection.getInstance();

