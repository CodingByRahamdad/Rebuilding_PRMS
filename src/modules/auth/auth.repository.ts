import mongoose from 'mongoose';
import { UserModel, IUser } from '../users/models/user.model';
import { memoryStore, InMemoryUser } from '../../shared/database/memory-store';
import { assertDatabaseConnection, isDemoModeEnabled, isDbConnected } from '../../shared/database/db-guard';

export class AuthRepository {
  public async findByEmailWithPassword(email: string): Promise<IUser | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const user = await UserModel.findOne({ email: email.toLowerCase(), isDeleted: false })
          .select('+passwordHash +refreshToken +passwordResetTokenHash +passwordResetExpires')
          .exec();
        if (user) return user;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose query failed, falling back to in-memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    // Fallback in-memory query
    const memUser = memoryStore.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && !u.isDeleted
    );
    if (!memUser) return null;
    return memUser as unknown as IUser;
  }

  public async findById(id: string): Promise<IUser | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const user = await UserModel.findOne({ _id: id, isDeleted: false }).exec();
        if (user) return user;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose query failed, falling back to in-memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const memUser = memoryStore.users.find((u) => (u._id === id || u.id === id) && !u.isDeleted);
    if (!memUser) return null;
    return memUser as unknown as IUser;
  }

  public async findByIdWithRefreshToken(id: string): Promise<IUser | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const user = await UserModel.findOne({ _id: id, isDeleted: false })
          .select('+refreshToken')
          .exec();
        if (user) return user;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose query failed, falling back to in-memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const memUser = memoryStore.users.find((u) => (u._id === id || u.id === id) && !u.isDeleted);
    if (!memUser) return null;
    return memUser as unknown as IUser;
  }

  public async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        await UserModel.updateOne(
          { _id: userId },
          { $set: { refreshToken } }
        ).exec();
        return;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose update failed, updating in-memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return;

    const memUser = memoryStore.users.find((u) => u._id === userId || u.id === userId);
    if (memUser) {
      memUser.refreshToken = refreshToken;
      memUser.updatedAt = new Date();
    }
  }

  public async updatePassword(userId: string, passwordHash: string): Promise<void> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        await UserModel.updateOne(
          { _id: userId },
          { $set: { passwordHash } }
        ).exec();
        return;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose update failed, updating in-memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return;

    const memUser = memoryStore.users.find((u) => u._id === userId || u.id === userId);
    if (memUser) {
      memUser.passwordHash = passwordHash;
      memUser.updatedAt = new Date();
    }
  }

  public async savePasswordResetToken(
    userId: string,
    tokenHash: string,
    expires: Date
  ): Promise<void> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        await UserModel.updateOne(
          { _id: userId },
          {
            $set: {
              passwordResetTokenHash: tokenHash,
              passwordResetExpires: expires,
            },
          }
        ).exec();
        return;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose update failed, updating in-memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return;

    const memUser = memoryStore.users.find((u) => u._id === userId || u.id === userId);
    if (memUser) {
      memUser.passwordResetTokenHash = tokenHash;
      memUser.passwordResetExpires = expires;
      memUser.updatedAt = new Date();
    }
  }

  public async completePasswordReset(
    userId: string,
    newPasswordHash: string
  ): Promise<void> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        await UserModel.updateOne(
          { _id: userId },
          {
            $set: {
              passwordHash: newPasswordHash,
              refreshToken: null,
            },
            $unset: {
              passwordResetTokenHash: 1,
              passwordResetExpires: 1,
            },
          }
        ).exec();
        return;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose update failed, updating in-memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return;

    const memUser = memoryStore.users.find((u) => u._id === userId || u.id === userId);
    if (memUser) {
      memUser.passwordHash = newPasswordHash;
      memUser.refreshToken = null;
      memUser.passwordResetTokenHash = null;
      memUser.passwordResetExpires = null;
      memUser.updatedAt = new Date();
    }
  }
}
