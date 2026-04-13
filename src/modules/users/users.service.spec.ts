import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));
import { User } from './entity/users.entity';
import { GetAllUsersInput } from './dto/get-all-users.input';

const mockUser: User = {
  id: 'user-id',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  password: 'secret',
  isVerified: true,
  adminApproved: false,
  mobile: '9999999999',
  createdAt: new Date(),
  role: { id: 'role-id', name: 'user', permissions: [] } as any,
};

const createQueryBuilderMock = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getCount: jest.fn(),
  getMany: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: Partial<Repository<User>>;
  let queryBuilder: ReturnType<typeof createQueryBuilderMock>;

  beforeEach(async () => {
    queryBuilder = createQueryBuilderMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should return all users', async () => {
    (repo.find as jest.Mock).mockResolvedValue([mockUser]);

    const result = await service.getAllUsers();

    expect(repo.find).toHaveBeenCalledTimes(1);
    expect(result).toEqual([mockUser]);
  });

  it('should return paginated users with defaults when filters are empty', async () => {
    queryBuilder.getCount.mockResolvedValue(2);
    queryBuilder.getMany.mockResolvedValue([mockUser]);

    const result = await service.getAllUsersPaginated({} as GetAllUsersInput);

    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('user.role', 'role');
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('user.createdAt', 'DESC');
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(10);
    expect(result).toEqual({
      users: [mockUser],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('should apply search, role ids, verification, approval, and pagination filters', async () => {
    queryBuilder.getCount.mockResolvedValue(4);
    queryBuilder.getMany.mockResolvedValue([mockUser]);

    const filters: GetAllUsersInput = {
      page: 2,
      limit: 3,
      search: 'jane',
      roleIds: ['role-1', 'role-2'],
      isVerified: true,
      adminApproved: false,
      sortBy: 'firstName',
      sortOrder: 'ASC',
    };

    const result = await service.getAllUsersPaginated(filters);

    expect(queryBuilder.where).toHaveBeenCalledWith(
      '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR user.mobile ILIKE :search)',
      { search: '%jane%' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('role.id IN (:...roleIds)', {
      roleIds: ['role-1', 'role-2'],
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('user.isVerified = :isVerified', {
      isVerified: true,
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('user.adminApproved = :adminApproved', {
      adminApproved: false,
    });
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('user.firstName', 'ASC');
    expect(queryBuilder.skip).toHaveBeenCalledWith(3);
    expect(queryBuilder.take).toHaveBeenCalledWith(3);
    expect(result.totalPages).toBe(2);
  });

  it('should throw NotFoundException when getUserById misses', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(undefined);
    await expect(service.getUserById('missing-id')).rejects.toThrow(NotFoundException);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'missing-id' } });
  });

  it('should return user by id when found', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(mockUser);
    const result = await service.getUserById('user-id');
    expect(result).toEqual(mockUser);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'user-id' } });
  });

  it('should update user profile without hashing when password is not provided', async () => {
    const storedUser = { ...mockUser, password: 'secret' } as User;
    (repo.findOne as jest.Mock).mockResolvedValue(storedUser);
    (repo.save as jest.Mock).mockResolvedValue({ ...storedUser, firstName: 'Janet' });

    const result = await service.updateUserProfile('user-id', {
      firstName: 'Janet',
    } as any);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'user-id' } });
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Janet' }));
    expect(result.firstName).toBe('Janet');
    expect(result.password).toBe('secret');
  });

  it('should hash password when updating profile with new password', async () => {
    const storedUser = { ...mockUser, password: 'secret' } as User;
    (repo.findOne as jest.Mock).mockResolvedValue(storedUser);
    (repo.save as jest.Mock).mockResolvedValue({ ...storedUser, password: 'hashed-password' });
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

    const result = await service.updateUserProfile('user-id', {
      password: 'new-pwd',
    } as any);

    expect(bcrypt.hash).toHaveBeenCalledWith('new-pwd', 10);
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ password: 'hashed-password' }));
    expect(result.password).toBe('hashed-password');
  });
});
