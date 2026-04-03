import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Permission } from './entity/permission.entity';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PermissionService } from './permission.service';
import { ApiResponse } from '../../common/dto/api-response.dto';

@Resolver(() => Permission)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles('admin')
export class PermissionResolver {
  constructor(private permissionService: PermissionService) {}

  @Mutation(() => ApiResponse<Permission>)
  createPermission(@Args('name') name: string) {
    const permission = this.permissionService.createPermission(name);
    return {
      statusCode: 201,
      message: 'Permission created successfully',
      data: permission,
    };
  }

  @Query(() => ApiResponse<Permission[]>)
  getPermission() {
    const permissions = this.permissionService.findAll();
    return {
      statusCode: 200,
      message: 'Permissions retrieved successfully',
      data: permissions,
    };
  }

  @Mutation(() => ApiResponse<boolean>)
  async assignPermission(
    @Args('roleId', { type: () => String }) roleId: string,
    @Args('permissionId', { type: () => String }) permissionId: string,
  ) {
    await this.permissionService.assignPermission(roleId, permissionId);
    return {
      statusCode: 200,
      message: 'Permission assigned successfully',
      data: true,
    };
  }

  @Mutation(() => ApiResponse<boolean>)
  async removePermission(
    @Args('roleId', { type: () => String }) roleId: string,
    @Args('permissionId', { type: () => String }) permissionId: string,
  ) {
    await this.permissionService.removePermission(roleId, permissionId);
    return {
      statusCode: 200,
      message: 'Permission removed successfully',
      data: true,
    };
  }

  @Query(() => ApiResponse<Permission[]>)
  getpermissionByRole(@Args('roleId', { type: () => String }) roleId: string) {
    const permissions = this.permissionService.getPermissionByRole(roleId);
    return {
      statusCode: 200,
      message: 'Permissions by role retrieved successfully',
      data: permissions,
    };
  }
}
