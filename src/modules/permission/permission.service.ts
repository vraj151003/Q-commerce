import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entity/permission.entity';
import { Repository } from 'typeorm';
import { Role } from '../roles/entity/roles.entity';
import { GetPermissionsInput } from './dto/get-permissions.input';
import { PaginatedPermissionsResponse } from './dto/paginated-permission.response';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,

    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
  ) {}

  createPermission(name: string) {
    const permission = this.permissionRepo.create({ name });
    return this.permissionRepo.save(permission);
  }

  findAllPermissions() {
    return this.permissionRepo.find();
  }

  async findAllPermissionsPaginated(
    filters: GetPermissionsInput,
  ): Promise<PaginatedPermissionsResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'name',
      sortOrder = 'ASC',
    } = filters;

    const queryBuilder = this.permissionRepo.createQueryBuilder('permission');

    // Search filter
    if (search) {
      queryBuilder.where('permission.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // Sorting
    const sortField =
      sortBy === 'createdAt' ? 'permission.createdAt' : 'permission.name';
    queryBuilder.orderBy(sortField, sortOrder);

    // Total count
    const total = await queryBuilder.getCount();

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const permissions = await queryBuilder.getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      permissions,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async assignPermission(roleId: string, permissionId: string) {
    const role = await this.roleRepo.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    const permission = await this.permissionRepo.findOne({
      where: { id: permissionId },
    });

    if (!role || !permission) {
      throw new BadRequestException('Role or Permission not found');
    }

    role.permissions.push(permission);
    return this.roleRepo.save(role);
  }

  async removePermission(roleId: string, permissionId: string) {
    const role = await this.roleRepo.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    const permission = await this.permissionRepo.findOne({
      where: { id: permissionId },
    });

    if (!role || !permission) {
      throw new BadRequestException('Role or Permission not found');
    }

    role.permissions = role.permissions.filter(
      (perm) => perm.id !== permissionId,
    );
    return this.roleRepo.save(role);
  }

  async getPermissionByRole(roleId: string) {
    const role = await this.roleRepo.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new BadRequestException('Role not found');
    }
    return role?.permissions;
  }
}
