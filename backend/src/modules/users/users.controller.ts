import { Request, Response } from 'express';
import { UserService } from './users.service';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HttpStatus } from '../../shared/constants/http-status';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  public createUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.createUser(req.body);
    return ApiResponse.created(res, user, 'User account created successfully');
  });

  public getUsers = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.userService.getUsers(req.query as any);
    return ApiResponse.paginated(res, result.users, result.meta, 'Users retrieved successfully');
  });

  public getUserById = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.getUserById(req.params.id);
    return ApiResponse.success(res, user, 'User details fetched successfully', HttpStatus.OK);
  });

  public updateUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.updateUser(req.params.id, req.body);
    return ApiResponse.success(res, user, 'User updated successfully', HttpStatus.OK);
  });

  public deleteUser = asyncHandler(async (req: Request, res: Response) => {
    await this.userService.deleteUser(req.params.id, req.user!.id);
    return ApiResponse.success(res, null, 'User deleted successfully', HttpStatus.OK);
  });
}
