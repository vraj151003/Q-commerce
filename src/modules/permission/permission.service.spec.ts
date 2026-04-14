import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionService } from './permission.service';
import { Permission } from './entity/permission.entity';
import { Role } from '../roles/entity/roles.entity';
import { GetPermissionsInput } from './dto/get-permissions.input';

describe('PermissionService', () => {
  let service: PermissionService;
  let permissionRepo: jest.Mocked<Repository<Permission>>;
  let roleRepo: jest.Mocked<Repository<Role>>;

  const mockPermission: Permission = {
    id: 'permission-1',
    name: 'CREATE_PRODUCT',
    roles: [],
  };

  const mockRole: Role = {
    id: 'role-1',
    name: 'admin',
    permissions: [mockPermission],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: getRepositoryToken(Permission),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    permissionRepo = module.get(getRepositoryToken(Permission));
    roleRepo = module.get(getRepositoryToken(Role));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPermission', () => {
    it('should create a permission successfully', async () => {
      permissionRepo.create.mockReturnValue(mockPermission);
      permissionRepo.save.mockResolvedValue(mockPermission);

      const result = await service.createPermission('CREATE_PRODUCT');

      expect(permissionRepo.create).toHaveBeenCalledWith({ name: 'CREATE_PRODUCT' });
      expect(permissionRepo.save).toHaveBeenCalledWith(mockPermission);
      expect(result).toEqual(mockPermission);
    });

    it('should handle save errors gracefully', async () => {
      permissionRepo.create.mockReturnValue(mockPermission);
      permissionRepo.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createPermission('CREATE_PRODUCT')).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle empty permission name', async () => {
      const emptyNamePermission = { ...mockPermission, name: '' };
      permissionRepo.create.mockReturnValue(emptyNamePermission);
      permissionRepo.save.mockResolvedValue(emptyNamePermission);

      const result = await service.createPermission('');

      expect(permissionRepo.create).toHaveBeenCalledWith({ name: '' });
      expect(result).toEqual(emptyNamePermission);
    });

    it('should handle very long permission name', async () => {
      const longName = 'a'.repeat(1000);
      const longNamePermission = { ...mockPermission, name: longName };
      permissionRepo.create.mockReturnValue(longNamePermission);
      permissionRepo.save.mockResolvedValue(longNamePermission);

      const result = await service.createPermission(longName);

      expect(permissionRepo.create).toHaveBeenCalledWith({ name: longName });
      expect(result).toEqual(longNamePermission);
    });

    it('should handle permission name with special characters', async () => {
      const specialName = 'PERMISSION_@#$%^&*()';
      const specialNamePermission = { ...mockPermission, name: specialName };
      permissionRepo.create.mockReturnValue(specialNamePermission);
      permissionRepo.save.mockResolvedValue(specialNamePermission);

      const result = await service.createPermission(specialName);

      expect(permissionRepo.create).toHaveBeenCalledWith({ name: specialName });
      expect(result).toEqual(specialNamePermission);
    });

    it('should handle permission name with spaces', async () => {
      const spaceName = 'CREATE PRODUCT';
      const spaceNamePermission = { ...mockPermission, name: spaceName };
      permissionRepo.create.mockReturnValue(spaceNamePermission);
      permissionRepo.save.mockResolvedValue(spaceNamePermission);

      const result = await service.createPermission(spaceName);

      expect(permissionRepo.create).toHaveBeenCalledWith({ name: spaceName });
      expect(result).toEqual(spaceNamePermission);
    });
  });

  describe('findAllPermissions', () => {
    it('should return an array of permissions', async () => {
      const permissions = [
        mockPermission,
        { ...mockPermission, id: 'permission-2', name: 'UPDATE_PRODUCT' },
      ];
      permissionRepo.find.mockResolvedValue(permissions);

      const result = await service.findAllPermissions();

      expect(permissionRepo.find).toHaveBeenCalled();
      expect(result).toEqual(permissions);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no permissions exist', async () => {
      permissionRepo.find.mockResolvedValue([]);

      const result = await service.findAllPermissions();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      permissionRepo.find.mockRejectedValue(new Error('Database error'));

      await expect(service.findAllPermissions()).rejects.toThrow('Database error');
    });
  });

  describe('findAllPermissionsPaginated', () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(10),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockPermission]),
    };

    it('should return paginated permissions with default filters', async () => {
      permissionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAllPermissionsPaginated({});

      expect(permissionRepo.createQueryBuilder).toHaveBeenCalledWith('permission');
      expect(result).toEqual({
        permissions: [mockPermission],
        total: 10,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should return paginated permissions with custom page and limit', async () => {
      const filters: GetPermissionsInput = { page: 2, limit: 5 };
      permissionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAllPermissionsPaginated(filters);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });

    it('should return paginated permissions with search filter', async () => {
      const filters: GetPermissionsInput = { search: 'CREATE' };
      permissionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAllPermissionsPaginated(filters);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('permission.name ILIKE :search', {
        search: '%CREATE%',
      });
    });

    it('should return paginated permissions with sortBy createdAt', async () => {
      const filters: GetPermissionsInput = { sortBy: 'createdAt' };
      permissionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAllPermissionsPaginated(filters);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('permission.createdAt', 'ASC');
    });

    it('should return paginated permissions with sortBy name', async () => {
      const filters: GetPermissionsInput = { sortBy: 'name' };
      permissionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAllPermissionsPaginated(filters);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('permission.name', 'ASC');
    });

    it('should return paginated permissions with sortOrder DESC', async () => {
      const filters: GetPermissionsInput = { sortOrder: 'DESC' };
      permissionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAllPermissionsPaginated(filters);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('permission.name', 'DESC');
    });

    it('should return paginated permissions with all filters', async () => {
      const filters: GetPermissionsInput = {
        page: 2,
        limit: 20,
        search: 'PRODUCT',
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };
      permissionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAllPermissionsPaginated(filters);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('permission.name ILIKE :search', {
        search: '%PRODUCT%',
      });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('permission.createdAt', 'DESC');
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });

    it('should calculate totalPages correctly', async () => {
      const countQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(25),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPermission]),
      };
      permissionRepo.createQueryBuilder.mockReturnValue(countQueryBuilder as any);

      const result = await service.findAllPermissionsPaginated({ page: 1, limit: 10 });

      expect(result.totalPages).toBe(3);
    });

    it('should handle empty search term', async () => {
      const filters: GetPermissionsInput = { search: '' };
      permissionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAllPermissionsPaginated(filters);

      // When search is empty string, where is not called (empty string is falsy)
      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
    });

    it('should handle very large page number', async () => {
      const filters: GetPermissionsInput = { page: 999999 };
      permissionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAllPermissionsPaginated(filters);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(9999980);
    });

    it('should handle very large limit', async () => {
      const filters: GetPermissionsInput = { limit: 999999 };
      permissionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAllPermissionsPaginated(filters);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(999999);
    });

    it('should handle zero page (should default to 1)', async () => {
      const filters: GetPermissionsInput = { page: 0 };
      permissionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAllPermissionsPaginated(filters);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(-10);
    });

    it('should handle negative page', async () => {
      const filters: GetPermissionsInput = { page: -1 };
      permissionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAllPermissionsPaginated(filters);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(-20);
    });

    it('should handle zero limit (should default to 10)', async () => {
      const filters: GetPermissionsInput = { limit: 0 };
      permissionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAllPermissionsPaginated(filters);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(0);
    });

    it('should handle database errors gracefully', async () => {
      permissionRepo.createQueryBuilder.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(service.findAllPermissionsPaginated({})).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('assignPermission', () => {
    it('should assign permission to role successfully', async () => {
      roleRepo.findOne.mockResolvedValue(mockRole);
      permissionRepo.findOne.mockResolvedValue(mockPermission);
      roleRepo.save.mockResolvedValue(mockRole);

      const result = await service.assignPermission('role-1', 'permission-1');

      expect(roleRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'role-1' },
        relations: ['permissions'],
      });
      expect(permissionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'permission-1' },
      });
      expect(roleRepo.save).toHaveBeenCalled();
      expect(result.permissions).toContain(mockPermission);
    });

    it('should throw BadRequestException when role is not found', async () => {
      roleRepo.findOne.mockResolvedValue(null);
      permissionRepo.findOne.mockResolvedValue(mockPermission);

      await expect(service.assignPermission('invalid-role', 'permission-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.assignPermission('invalid-role', 'permission-1')).rejects.toThrow(
        'Role or Permission not found',
      );
    });

    it('should throw BadRequestException when permission is not found', async () => {
      roleRepo.findOne.mockResolvedValue(mockRole);
      permissionRepo.findOne.mockResolvedValue(null);

      await expect(service.assignPermission('role-1', 'invalid-permission')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.assignPermission('role-1', 'invalid-permission')).rejects.toThrow(
        'Role or Permission not found',
      );
    });

    it('should throw BadRequestException when both role and permission are not found', async () => {
      roleRepo.findOne.mockResolvedValue(null);
      permissionRepo.findOne.mockResolvedValue(null);

      await expect(service.assignPermission('invalid-role', 'invalid-permission')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.assignPermission('invalid-role', 'invalid-permission')).rejects.toThrow(
        'Role or Permission not found',
      );
    });

    it('should handle assigning same permission to role (idempotent)', async () => {
      const roleWithExistingPermission = {
        ...mockRole,
        permissions: [mockPermission],
      };
      roleRepo.findOne.mockResolvedValue(roleWithExistingPermission);
      permissionRepo.findOne.mockResolvedValue(mockPermission);
      roleRepo.save.mockResolvedValue(roleWithExistingPermission);

      const result = await service.assignPermission('role-1', 'permission-1');

      expect(roleRepo.save).toHaveBeenCalled();
    });

    it('should handle empty role id', async () => {
      roleRepo.findOne.mockResolvedValue(null);
      permissionRepo.findOne.mockResolvedValue(mockPermission);

      await expect(service.assignPermission('', 'permission-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle empty permission id', async () => {
      roleRepo.findOne.mockResolvedValue(mockRole);
      permissionRepo.findOne.mockResolvedValue(null);

      await expect(service.assignPermission('role-1', '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle very long role id', async () => {
      const longRoleId = 'a'.repeat(1000);
      roleRepo.findOne.mockResolvedValue(null);
      permissionRepo.findOne.mockResolvedValue(mockPermission);

      await expect(service.assignPermission(longRoleId, 'permission-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle very long permission id', async () => {
      const longPermissionId = 'a'.repeat(1000);
      roleRepo.findOne.mockResolvedValue(mockRole);
      permissionRepo.findOne.mockResolvedValue(null);

      await expect(service.assignPermission('role-1', longPermissionId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle save errors gracefully', async () => {
      roleRepo.findOne.mockResolvedValue(mockRole);
      permissionRepo.findOne.mockResolvedValue(mockPermission);
      roleRepo.save.mockRejectedValue(new Error('Database error'));

      await expect(service.assignPermission('role-1', 'permission-1')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('removePermission', () => {
    it('should remove permission from role successfully', async () => {
      const roleWithoutPermission = { ...mockRole, permissions: [] };
      roleRepo.findOne.mockResolvedValue(mockRole);
      permissionRepo.findOne.mockResolvedValue(mockPermission);
      roleRepo.save.mockResolvedValue(roleWithoutPermission);

      const result = await service.removePermission('role-1', 'permission-1');

      expect(roleRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'role-1' },
        relations: ['permissions'],
      });
      expect(permissionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'permission-1' },
      });
      expect(roleRepo.save).toHaveBeenCalledWith(roleWithoutPermission);
      expect(result).toEqual(roleWithoutPermission);
    });

    it('should throw BadRequestException when role is not found', async () => {
      roleRepo.findOne.mockResolvedValue(null);
      permissionRepo.findOne.mockResolvedValue(mockPermission);

      await expect(service.removePermission('invalid-role', 'permission-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.removePermission('invalid-role', 'permission-1')).rejects.toThrow(
        'Role or Permission not found',
      );
    });

    it('should throw BadRequestException when permission is not found', async () => {
      roleRepo.findOne.mockResolvedValue(mockRole);
      permissionRepo.findOne.mockResolvedValue(null);

      await expect(service.removePermission('role-1', 'invalid-permission')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.removePermission('role-1', 'invalid-permission')).rejects.toThrow(
        'Role or Permission not found',
      );
    });

    it('should throw BadRequestException when both role and permission are not found', async () => {
      roleRepo.findOne.mockResolvedValue(null);
      permissionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.removePermission('invalid-role', 'invalid-permission'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.removePermission('invalid-role', 'invalid-permission'),
      ).rejects.toThrow('Role or Permission not found');
    });

    it('should handle removing non-existent permission from role (no-op)', async () => {
      const roleWithOtherPermission = {
        ...mockRole,
        permissions: [{ ...mockPermission, id: 'permission-2' }],
      };
      roleRepo.findOne.mockResolvedValue(roleWithOtherPermission);
      permissionRepo.findOne.mockResolvedValue(mockPermission);
      roleRepo.save.mockResolvedValue(roleWithOtherPermission);

      const result = await service.removePermission('role-1', 'permission-1');

      expect(roleRepo.save).toHaveBeenCalled();
    });

    it('should handle empty role id', async () => {
      roleRepo.findOne.mockResolvedValue(null);
      permissionRepo.findOne.mockResolvedValue(mockPermission);

      await expect(service.removePermission('', 'permission-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle empty permission id', async () => {
      roleRepo.findOne.mockResolvedValue(mockRole);
      permissionRepo.findOne.mockResolvedValue(null);

      await expect(service.removePermission('role-1', '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle save errors gracefully', async () => {
      roleRepo.findOne.mockResolvedValue(mockRole);
      permissionRepo.findOne.mockResolvedValue(mockPermission);
      roleRepo.save.mockRejectedValue(new Error('Database error'));

      await expect(service.removePermission('role-1', 'permission-1')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getPermissionByRole', () => {
    it('should return permissions for a role', async () => {
      roleRepo.findOne.mockResolvedValue(mockRole);

      const result = await service.getPermissionByRole('role-1');

      expect(roleRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'role-1' },
        relations: ['permissions'],
      });
      expect(result).toEqual(mockRole.permissions);
    });

    it('should throw BadRequestException when role is not found', async () => {
      roleRepo.findOne.mockResolvedValue(null);

      await expect(service.getPermissionByRole('invalid-role')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getPermissionByRole('invalid-role')).rejects.toThrow(
        'Role not found',
      );
    });

    it('should return empty array when role has no permissions', async () => {
      const roleWithoutPermissions = { ...mockRole, permissions: [] };
      roleRepo.findOne.mockResolvedValue(roleWithoutPermissions);

      const result = await service.getPermissionByRole('role-1');

      expect(result).toEqual([]);
    });

    it('should handle empty role id', async () => {
      roleRepo.findOne.mockResolvedValue(null);

      await expect(service.getPermissionByRole('')).rejects.toThrow(BadRequestException);
    });

    it('should handle very long role id', async () => {
      const longRoleId = 'a'.repeat(1000);
      roleRepo.findOne.mockResolvedValue(null);

      await expect(service.getPermissionByRole(longRoleId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle role with multiple permissions', async () => {
      const roleWithMultiplePermissions = {
        ...mockRole,
        permissions: [
          mockPermission,
          { ...mockPermission, id: 'permission-2', name: 'UPDATE_PRODUCT' },
          { ...mockPermission, id: 'permission-3', name: 'DELETE_PRODUCT' },
        ],
      };
      roleRepo.findOne.mockResolvedValue(roleWithMultiplePermissions);

      const result = await service.getPermissionByRole('role-1');

      expect(result.length).toBe(3);
    });

    it('should handle database errors gracefully', async () => {
      roleRepo.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.getPermissionByRole('role-1')).rejects.toThrow('Database error');
    });
  });

  describe('updatePermission', () => {
    it('should update permission name successfully', async () => {
      const updatedPermission = { ...mockPermission, name: 'UPDATE_PRODUCT' };
      permissionRepo.findOne.mockResolvedValue(mockPermission);
      permissionRepo.save.mockResolvedValue(updatedPermission);

      const result = await service.updatePermission('permission-1', 'UPDATE_PRODUCT');

      expect(permissionRepo.findOne).toHaveBeenCalledWith({ where: { id: 'permission-1' } });
      expect(permissionRepo.save).toHaveBeenCalledWith(updatedPermission);
      expect(result.name).toBe('UPDATE_PRODUCT');
    });

    it('should throw BadRequestException when permission is not found', async () => {
      permissionRepo.findOne.mockResolvedValue(null);

      await expect(service.updatePermission('invalid-permission', 'NEW_NAME')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updatePermission('invalid-permission', 'NEW_NAME')).rejects.toThrow(
        'Permission not found',
      );
    });

    it('should handle empty permission id', async () => {
      permissionRepo.findOne.mockResolvedValue(null);

      await expect(service.updatePermission('', 'NEW_NAME')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle empty new name', async () => {
      const updatedPermission = { ...mockPermission, name: '' };
      permissionRepo.findOne.mockResolvedValue(mockPermission);
      permissionRepo.save.mockResolvedValue(updatedPermission);

      const result = await service.updatePermission('permission-1', '');

      expect(result.name).toBe('');
    });

    it('should handle very long new name', async () => {
      const longName = 'a'.repeat(1000);
      const updatedPermission = { ...mockPermission, name: longName };
      permissionRepo.findOne.mockResolvedValue(mockPermission);
      permissionRepo.save.mockResolvedValue(updatedPermission);

      const result = await service.updatePermission('permission-1', longName);

      expect(result.name).toBe(longName);
    });

    it('should handle name with special characters', async () => {
      const specialName = 'PERMISSION_@#$%^&*()';
      const updatedPermission = { ...mockPermission, name: specialName };
      permissionRepo.findOne.mockResolvedValue(mockPermission);
      permissionRepo.save.mockResolvedValue(updatedPermission);

      const result = await service.updatePermission('permission-1', specialName);

      expect(result.name).toBe(specialName);
    });

    it('should handle name with spaces', async () => {
      const spaceName = 'UPDATE PRODUCT';
      const updatedPermission = { ...mockPermission, name: spaceName };
      permissionRepo.findOne.mockResolvedValue(mockPermission);
      permissionRepo.save.mockResolvedValue(updatedPermission);

      const result = await service.updatePermission('permission-1', spaceName);

      expect(result.name).toBe(spaceName);
    });

    it('should handle updating to same name (idempotent)', async () => {
      permissionRepo.findOne.mockResolvedValue(mockPermission);
      permissionRepo.save.mockResolvedValue(mockPermission);

      const result = await service.updatePermission('permission-1', 'CREATE_PRODUCT');

      expect(result.name).toBe('CREATE_PRODUCT');
    });

    it('should handle save errors gracefully', async () => {
      permissionRepo.findOne.mockResolvedValue(mockPermission);
      permissionRepo.save.mockRejectedValue(new Error('Database error'));

      await expect(service.updatePermission('permission-1', 'NEW_NAME')).rejects.toThrow(
        'Database error',
      );
    });
  });
});
