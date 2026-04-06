import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role } from './entity/roles.entity';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesService } from './roles.service';
import {
  RoleResponse,
  RoleListResponse,
  BooleanResponse,
} from '../../common/dto/api-response.dto';
import { GetRolesInput } from './dto/get-roles.input';
import { RoleListPaginatedResponse } from './dto/paginated-role.response';

@Resolver(() => Role)
@UseGuards(GqlAuthGuard, RolesGuard)
export class RolesResolver {
  constructor(private roleService: RolesService) {}

  @Mutation(() => RoleResponse)
  @Roles('admin')
  createRole(@Args('name') name: string) {
    const role = this.roleService.create(name);
    return {
      statusCode: 201,
      message: 'Role created successfully',
      data: role,
    };
  }

  @Query(() => RoleListPaginatedResponse)
  @Roles('admin')
  async getRoles(@Args('filters', { nullable: true }) filters?: GetRolesInput) {
    const result = await this.roleService.findAllRoles(filters || {});
    return {
      statusCode: 200,
      message: 'Roles retrieved successfully',
      data: result,
    };
  }

  @Query(() => RoleResponse)
  @Roles('admin')
  getRole(@Args('id') id: string) {
    const role = this.roleService.findOne(id);
    return {
      statusCode: 200,
      message: 'Role retrieved successfully',
      data: role,
    };
  }

  @Mutation(() => RoleResponse)
  @Roles('admin')
  updateRole(@Args('id') id: string, @Args('name') name: string) {
    const role = this.roleService.update(id, name);
    return {
      statusCode: 200,
      message: 'Role updated successfully',
      data: role,
    };
  }

  @Mutation(() => BooleanResponse)
  @Roles('admin')
  async deleteRole(@Args('id') id: string) {
    await this.roleService.remove(id);
    return {
      statusCode: 200,
      message: 'Role deleted successfully',
      data: true,
    };
  }
}
