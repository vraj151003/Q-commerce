import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entity/users.entity';
import { UpdateUserProfileInput } from './dto/update-user-profile.input';
import { GetAllUsersInput } from './dto/get-all-users.input';
import { PaginatedUsersResponse } from './dto/paginated-user.response';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getAllUsers(): Promise<User[]> {
    return this.userRepo.find();
  }

  async getAllUsersPaginated(
    filters: GetAllUsersInput,
  ): Promise<PaginatedUsersResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      roleIds,
      isVerified,
      adminApproved,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const queryBuilder = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('role.permissions', 'permissions');

    // Search filter
    if (search) {
      queryBuilder.where(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR user.mobile ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Role filter
    if (roleIds && roleIds.length > 0) {
      queryBuilder.andWhere('role.id IN (:...roleIds)', { roleIds });
    }

    // Verification status filter
    if (isVerified !== undefined) {
      queryBuilder.andWhere('user.isVerified = :isVerified', { isVerified });
    }

    // Admin approval filter
    if (adminApproved !== undefined) {
      queryBuilder.andWhere('user.adminApproved = :adminApproved', {
        adminApproved,
      });
    }

    // Sorting
    const sortField =
      sortBy === 'createdAt' ? 'user.createdAt' : `user.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder);

    // Total count
    const total = await queryBuilder.getCount();

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const users = await queryBuilder.getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUserProfile(
    userId: string,
    input: UpdateUserProfileInput,
  ): Promise<User> {
    const user = await this.getUserById(userId);

    if (input.firstName !== undefined) {
      user.firstName = input.firstName;
    }
    if (input.lastName !== undefined) {
      user.lastName = input.lastName;
    }
    if (input.mobile !== undefined) {
      user.mobile = input.mobile;
    }
    if (input.password) {
      user.password = await bcrypt.hash(input.password, 10);
    }

    return this.userRepo.save(user);
  }
}
