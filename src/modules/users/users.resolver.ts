import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  UserListResponse,
  UserResponse,
} from '../../common/dto/api-response.dto';
import { UpdateUserProfileInput } from './dto/update-user-profile.input';
import { UsersService } from './users.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetAllUsersInput } from './dto/get-all-users.input';
import { UserListPaginatedResponse } from './dto/paginated-user.response';
import { Injectable } from '@nestjs/common';

@Injectable()
@Resolver()
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => UserListPaginatedResponse)
  async getAllUserProfiles(
    @Args('filters', { nullable: true }) filters?: GetAllUsersInput,
  ) {
    const result = await this.usersService.getAllUsersPaginated(filters || {});
    return {
      statusCode: 200,
      message: 'Users retrieved successfully',
      data: result,
    };
  }

  @Query(() => UserResponse)
  async getUserProfileById(@Args('id') id: string) {
    const currentUser = await this.usersService.getUserById(id);
    return {
      statusCode: 200,
      message: 'User retrieved successfully',
      data: currentUser,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Mutation(() => UserResponse)
  async getUserById(@Args('id') id: string) {
    const user = await this.usersService.getUserById(id);
    return {
      statusCode: 200,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => UserResponse)
  async updateUserProfile(
    @Context() context: any,
    @Args('input') input: UpdateUserProfileInput,
  ) {
    const user = context.req.user;
    const updatedUser = await this.usersService.updateUserProfile(
      user.userId,
      input,
    );
    return {
      statusCode: 200,
      message: 'User profile updated successfully',
      data: updatedUser,
    };
  }
}
