import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entity/roles.entity';
import { Repository } from 'typeorm';
import { GetRolesInput } from './dto/get-roles.input';
import { PaginatedRolesResponse } from './dto/paginated-role.response';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
  ) {}

  create(name: string) {
    const role = this.rolesRepo.create({ name });
    return this.rolesRepo.save(role);
  }

  findAll() {
    return this.rolesRepo.find();
  }

  async findAllRoles(
    filters: GetRolesInput,
  ): Promise<PaginatedRolesResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      permissionIds,
      sortBy = 'name',
      sortOrder = 'ASC',
    } = filters;

    const queryBuilder = this.rolesRepo
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permissions');

    // Search filter
    if (search) {
      queryBuilder.where('role.name ILIKE :search', { search: `%${search}%` });
    }

    // Permission filter
    if (permissionIds && permissionIds.length > 0) {
      queryBuilder.andWhere('permissions.id IN (:...permissionIds)', {
        permissionIds,
      });
    }

    // Sorting
    const sortField = sortBy === 'createdAt' ? 'role.createdAt' : 'role.name';
    queryBuilder.orderBy(sortField, sortOrder);

    // Total count
    const total = await queryBuilder.getCount();

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const roles = await queryBuilder.getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      roles,
      total,
      page,
      limit,
      totalPages,
    };
  }

  findOne(id: string) {
    return this.rolesRepo.findOneBy({ id });
  }

  async update(id: string, name: string) {
    const role = await this.rolesRepo.findOneBy({ id });
    if (!role) {
      throw new BadRequestException('roles not found');
    }

    role.name = name;
    return this.rolesRepo.save(role);
  }

  async remove(id: string) {
    const role = await this.rolesRepo.findOneBy({ id });
    if (!role) {
      throw new BadRequestException('roles not found');
    }
    return this.rolesRepo.remove(role);
  }
}
