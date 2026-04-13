import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Permission } from './entity/permission.entity';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PermissionService } from './permission.service';
import {
  PermissionResponse,
  PermissionListResponse,
  BooleanResponse,
} from '../../common/dto/api-response.dto';
import { GetPermissionsInput } from './dto/get-permissions.input';
import { PermissionListPaginatedResponse } from './dto/paginated-permission.response';

@Resolver(() => Permission)
@UseGuards(GqlAuthGuard, RolesGuard)
export class PermissionResolver {
  constructor(private permissionService: PermissionService) {}

  @Mutation(() => PermissionResponse)
  @Roles('admin')
  createPermission(@Args('name') name: string) {
    const permission = this.permissionService.createPermission(name);
    return {
      statusCode: 201,
      message: 'Permission created successfully',
      data: permission,
    };
  }

  @Mutation(() => PermissionResponse)
  @Roles('admin')
  updatePermission(@Args('id') id: string, @Args('name') name: string) {
    const permission = this.permissionService.updatePermission(id, name);
    return {
      statusCode: 200,
      message: 'Permission updated successfully',
      data: permission,
    };
  }

  @Query(() => PermissionListPaginatedResponse)
  @Roles('admin')
  async getPermission(
    @Args('filters', { nullable: true }) filters?: GetPermissionsInput,
  ) {
    const result = await this.permissionService.findAllPermissionsPaginated(
      filters || {},
    );
    return {
      statusCode: 200,
      message: 'Permissions retrieved successfully',
      data: result,
    };
  }

  @Mutation(() => BooleanResponse)
  @Roles('admin')
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

  @Mutation(() => BooleanResponse)
  @Roles('admin')
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

  @Query(() => PermissionListResponse)
  @Roles('admin')
  async getPermissionByRole(@Args('roleId') roleId: string) {
    const permissions =
      await this.permissionService.getPermissionByRole(roleId);
    return {
      statusCode: 200,
      message: 'Permissions retrieved successfully',
      data: permissions,
    };
  }
}
