import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role } from './entity/roles.entity';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesService } from './roles.service';
import { ApiResponse } from '../../common/dto/api-response.dto';

@Resolver(() => Role)
@UseGuards(GqlAuthGuard, RolesGuard)
export class RolesResolver {
  constructor(private roleService: RolesService) {}

  @Mutation(() => ApiResponse<Role>)
  @Roles('admin')
  createRole(@Args('name') name: string) {
    const role = this.roleService.create(name);
    return {
      statusCode: 201,
      message: 'Role created successfully',
      data: role,
    };
  }

  @Query(() => ApiResponse<Role[]>)
  @Roles('admin')
  getRoles() {
    const roles = this.roleService.findAll();
    return {
      statusCode: 200,
      message: 'Roles retrieved successfully',
      data: roles,
    };
  }

  @Query(() => ApiResponse<Role>)
  @Roles('admin')
  getRole(@Args('id') id: string) {
    const role = this.roleService.findOne(id);
    return {
      statusCode: 200,
      message: 'Role retrieved successfully',
      data: role,
    };
  }

  @Mutation(() => ApiResponse<Role>)
  @Roles('admin')
  updateRole(@Args('id') id: string, @Args('name') name: string) {
    const role = this.roleService.update(id, name);
    return {
      statusCode: 200,
      message: 'Role updated successfully',
      data: role,
    };
  }

  @Mutation(() => ApiResponse<boolean>)
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
