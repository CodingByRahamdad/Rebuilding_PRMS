import { Router } from 'express';
import { UserController } from './users.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import {
  createUserSchema,
  updateUserSchema,
  getUserQuerySchema,
  userIdParamSchema,
} from './users.validation';

const userRouter = Router();
const userController = new UserController();

// All user management endpoints require authentication
userRouter.use(authenticate);

userRouter.post('/', authorize('Super Admin'), validate(createUserSchema), userController.createUser);
userRouter.get('/', validate(getUserQuerySchema), userController.getUsers);
userRouter.get('/:id', validate(userIdParamSchema), userController.getUserById);
userRouter.put('/:id', authorize('Super Admin'), validate(updateUserSchema), userController.updateUser);
userRouter.delete('/:id', authorize('Super Admin'), validate(userIdParamSchema), userController.deleteUser);

export default userRouter;
