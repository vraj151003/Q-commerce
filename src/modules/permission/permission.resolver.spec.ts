import { Test, TestingModule } from '@nestjs/testing';
import { PermissionResolver } from './permission.resolver';
import { PermissionService } from './permission.service';
import { Permission } from './entity/permission.entity';
import { GetPermissionsInput } from './dto/get-permissions.input';
import { PaginatedPermissionsResponse } from './dto/paginated-permission.response';

describe('PermissionResolver', () => {
  let resolver: PermissionResolver;
  let permissionService: jest.Mocked<PermissionService>;

  const mockPermission: Permission = {
    id: 'permission-1',
    name: 'CREATE_PRODUCT',
    roles: [],
  };

  const mockRole: any = {
    id: 'role-1',
    name: 'admin',
    permissions: [mockPermission],
  };

  const mockPaginatedResponse: PaginatedPermissionsResponse = {
    permissions: [mockPermission],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionResolver,
        {
          provide: PermissionService,
          useValue: {
            createPermission: jest.fn(),
            updatePermission: jest.fn(),
            findAllPermissionsPaginated: jest.fn(),
            assignPermission: jest.fn(),
            removePermission: jest.fn(),
            getPermissionByRole: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<PermissionResolver>(PermissionResolver);
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPermission mutation', () => {
    it('should call service createPermission with correct name', async () => {
      permissionService.createPermission.mockResolvedValue(mockPermission);

      const resultPromise = resolver.createPermission('CREATE_PRODUCT');
      const result = await resultPromise;
      const data = await result.data;

      expect(permissionService.createPermission).toHaveBeenCalledWith('CREATE_PRODUCT');
      expect(result.statusCode).toBe(201);
      expect(result.message).toBe('Permission created successfully');
      expect(data).toEqual(mockPermission);
    });

    it('should handle empty permission name', async () => {
      permissionService.createPermission.mockResolvedValue(mockPermission);

      const result = await resolver.createPermission('');

      expect(permissionService.createPermission).toHaveBeenCalledWith('');
      expect(result.statusCode).toBe(201);
    });

    it('should handle very long permission name', async () => {
      const longName = 'a'.repeat(1000);
      permissionService.createPermission.mockResolvedValue(mockPermission);

      const result = await resolver.createPermission(longName);

      expect(permissionService.createPermission).toHaveBeenCalledWith(longName);
    });

    it('should handle permission name with special characters', async () => {
      const specialName = 'PERMISSION_@#$%^&*()';
      permissionService.createPermission.mockResolvedValue(mockPermission);

      const result = await resolver.createPermission(specialName);

      expect(permissionService.createPermission).toHaveBeenCalledWith(specialName);
    });

    it('should handle permission name with spaces', async () => {
      const spaceName = 'CREATE PRODUCT';
      permissionService.createPermission.mockResolvedValue(mockPermission);

      const result = await resolver.createPermission(spaceName);

      expect(permissionService.createPermission).toHaveBeenCalledWith(spaceName);
    });

    it('should handle permission name with underscores', async () => {
      const underscoreName = 'CREATE_PRODUCT';
      permissionService.createPermission.mockResolvedValue(mockPermission);

      const result = await resolver.createPermission(underscoreName);

      expect(permissionService.createPermission).toHaveBeenCalledWith(underscoreName);
    });

    it('should handle permission name with hyphens', async () => {
      const hyphenName = 'CREATE-PRODUCT';
      permissionService.createPermission.mockResolvedValue(mockPermission);

      const result = await resolver.createPermission(hyphenName);

      expect(permissionService.createPermission).toHaveBeenCalledWith(hyphenName);
    });
  });

  describe('updatePermission mutation', () => {
    it('should call service updatePermission with correct id and name', async () => {
      const updatedPermission = { ...mockPermission, name: 'UPDATE_PRODUCT' };
      permissionService.updatePermission.mockResolvedValue(updatedPermission);

      const resultPromise = resolver.updatePermission('permission-1', 'UPDATE_PRODUCT');
      const result = await resultPromise;
      const data = await result.data;

      expect(permissionService.updatePermission).toHaveBeenCalledWith(
        'permission-1',
        'UPDATE_PRODUCT',
      );
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Permission updated successfully');
      expect(data).toEqual(updatedPermission);
    });

    it('should handle empty permission id', async () => {
      permissionService.updatePermission.mockResolvedValue(mockPermission);

      const result = await resolver.updatePermission('', 'NEW_NAME');

      expect(permissionService.updatePermission).toHaveBeenCalledWith('', 'NEW_NAME');
    });

    it('should handle empty new name', async () => {
      permissionService.updatePermission.mockResolvedValue(mockPermission);

      const result = await resolver.updatePermission('permission-1', '');

      expect(permissionService.updatePermission).toHaveBeenCalledWith('permission-1', '');
    });

    it('should handle very long permission id', async () => {
      const longId = 'a'.repeat(1000);
      permissionService.updatePermission.mockResolvedValue(mockPermission);

      const result = await resolver.updatePermission(longId, 'NEW_NAME');

      expect(permissionService.updatePermission).toHaveBeenCalledWith(longId, 'NEW_NAME');
    });

    it('should handle very long new name', async () => {
      const longName = 'a'.repeat(1000);
      permissionService.updatePermission.mockResolvedValue(mockPermission);

      const result = await resolver.updatePermission('permission-1', longName);

      expect(permissionService.updatePermission).toHaveBeenCalledWith('permission-1', longName);
    });

    it('should handle special characters in id', async () => {
      const specialId = 'permission-1_@#$%^&*()';
      permissionService.updatePermission.mockResolvedValue(mockPermission);

      const result = await resolver.updatePermission(specialId, 'NEW_NAME');

      expect(permissionService.updatePermission).toHaveBeenCalledWith(specialId, 'NEW_NAME');
    });

    it('should handle special characters in new name', async () => {
      const specialName = 'PERMISSION_@#$%^&*()';
      permissionService.updatePermission.mockResolvedValue(mockPermission);

      const result = await resolver.updatePermission('permission-1', specialName);

      expect(permissionService.updatePermission).toHaveBeenCalledWith('permission-1', specialName);
    });
  });

  describe('getPermission query', () => {
    it('should return paginated permissions with default filters', async () => {
      permissionService.findAllPermissionsPaginated.mockResolvedValue(mockPaginatedResponse);

      const result = await resolver.getPermission();

      expect(permissionService.findAllPermissionsPaginated).toHaveBeenCalledWith({});
      expect(result).toEqual({
        statusCode: 200,
        message: 'Permissions retrieved successfully',
        data: mockPaginatedResponse,
      });
    });

    it('should return paginated permissions with custom filters', async () => {
      const filters: GetPermissionsInput = {
        page: 2,
        limit: 20,
        search: 'PRODUCT',
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };
      permissionService.findAllPermissionsPaginated.mockResolvedValue(mockPaginatedResponse);

      const result = await resolver.getPermission(filters);

      expect(permissionService.findAllPermissionsPaginated).toHaveBeenCalledWith(filters);
      expect(result).toEqual({
        statusCode: 200,
        message: 'Permissions retrieved successfully',
        data: mockPaginatedResponse,
      });
    });

    it('should handle null filters (should default to empty object)', async () => {
      permissionService.findAllPermissionsPaginated.mockResolvedValue(mockPaginatedResponse);

      const result = await resolver.getPermission(null as any);

      expect(permissionService.findAllPermissionsPaginated).toHaveBeenCalledWith({});
    });

    it('should handle undefined filters (should default to empty object)', async () => {
      permissionService.findAllPermissionsPaginated.mockResolvedValue(mockPaginatedResponse);

      const result = await resolver.getPermission(undefined);

      expect(permissionService.findAllPermissionsPaginated).toHaveBeenCalledWith({});
    });

    it('should handle filters with only page', async () => {
      const filters: GetPermissionsInput = { page: 5 };
      permissionService.findAllPermissionsPaginated.mockResolvedValue(mockPaginatedResponse);

      const result = await resolver.getPermission(filters);

      expect(permissionService.findAllPermissionsPaginated).toHaveBeenCalledWith(filters);
    });

    it('should handle filters with only limit', async () => {
      const filters: GetPermissionsInput = { limit: 50 };
      permissionService.findAllPermissionsPaginated.mockResolvedValue(mockPaginatedResponse);

      const result = await resolver.getPermission(filters);

      expect(permissionService.findAllPermissionsPaginated).toHaveBeenCalledWith(filters);
    });

    it('should handle filters with only search', async () => {
      const filters: GetPermissionsInput = { search: 'CREATE' };
      permissionService.findAllPermissionsPaginated.mockResolvedValue(mockPaginatedResponse);

      const result = await resolver.getPermission(filters);

      expect(permissionService.findAllPermissionsPaginated).toHaveBeenCalledWith(filters);
    });

    it('should handle filters with empty search string', async () => {
      const filters: GetPermissionsInput = { search: '' };
      permissionService.findAllPermissionsPaginated.mockResolvedValue(mockPaginatedResponse);

      const result = await resolver.getPermission(filters);

      expect(permissionService.findAllPermissionsPaginated).toHaveBeenCalledWith(filters);
    });

    it('should handle filters with very large page number', async () => {
      const filters: GetPermissionsInput = { page: 999999 };
      permissionService.findAllPermissionsPaginated.mockResolvedValue(mockPaginatedResponse);

      const result = await resolver.getPermission(filters);

      expect(permissionService.findAllPermissionsPaginated).toHaveBeenCalledWith(filters);
    });

    it('should handle filters with very large limit', async () => {
      const filters: GetPermissionsInput = { limit: 999999 };
      permissionService.findAllPermissionsPaginated.mockResolvedValue(mockPaginatedResponse);

      const result = await resolver.getPermission(filters);

      expect(permissionService.findAllPermissionsPaginated).toHaveBeenCalledWith(filters);
    });

    it('should handle filters with very long search term', async () => {
      const filters: GetPermissionsInput = { search: 'a'.repeat(1000) };
      permissionService.findAllPermissionsPaginated.mockResolvedValue(mockPaginatedResponse);

      const result = await resolver.getPermission(filters);

      expect(permissionService.findAllPermissionsPaginated).toHaveBeenCalledWith(filters);
    });

    it('should handle filters with sortBy name', async () => {
      const filters: GetPermissionsInput = { sortBy: 'name' };
      permissionService.findAllPermissionsPaginated.mockResolvedValue(mockPaginatedResponse);

      const result = await resolver.getPermission(filters);

      expect(permissionService.findAllPermissionsPaginated).toHaveBeenCalledWith(filters);
    });

    it('should handle filters with sortBy createdAt', async () => {
      const filters: GetPermissionsInput = { sortBy: 'createdAt' };
      permissionService.findAllPermissionsPaginated.mockResolvedValue(mockPaginatedResponse);

      const result = await resolver.getPermission(filters);

      expect(permissionService.findAllPermissionsPaginated).toHaveBeenCalledWith(filters);
    });

    it('should handle filters with sortOrder ASC', async () => {
      const filters: GetPermissionsInput = { sortOrder: 'ASC' };
      permissionService.findAllPermissionsPaginated.mockResolvedValue(mockPaginatedResponse);

      const result = await resolver.getPermission(filters);

      expect(permissionService.findAllPermissionsPaginated).toHaveBeenCalledWith(filters);
    });

    it('should handle filters with sortOrder DESC', async () => {
      const filters: GetPermissionsInput = { sortOrder: 'DESC' };
      permissionService.findAllPermissionsPaginated.mockResolvedValue(mockPaginatedResponse);

      const result = await resolver.getPermission(filters);

      expect(permissionService.findAllPermissionsPaginated).toHaveBeenCalledWith(filters);
    });

    it('should handle filters with negative page number', async () => {
      const filters: GetPermissionsInput = { page: -1 };
      permissionService.findAllPermissionsPaginated.mockResolvedValue(mockPaginatedResponse);

      const result = await resolver.getPermission(filters);

      expect(permissionService.findAllPermissionsPaginated).toHaveBeenCalledWith(filters);
    });

    it('should handle filters with zero limit', async () => {
      const filters: GetPermissionsInput = { limit: 0 };
      permissionService.findAllPermissionsPaginated.mockResolvedValue(mockPaginatedResponse);

      const result = await resolver.getPermission(filters);

      expect(permissionService.findAllPermissionsPaginated).toHaveBeenCalledWith(filters);
    });
  });

  describe('assignPermission mutation', () => {
    it('should call service assignPermission with correct roleId and permissionId', async () => {
      permissionService.assignPermission.mockResolvedValue(mockRole);

      const result = await resolver.assignPermission('role-1', 'permission-1');

      expect(permissionService.assignPermission).toHaveBeenCalledWith(
        'role-1',
        'permission-1',
      );
      expect(result).toEqual({
        statusCode: 200,
        message: 'Permission assigned successfully',
        data: true,
      });
    });


    it('should handle empty roleId', async () => {
      permissionService.assignPermission.mockResolvedValue(mockRole);

      const result = await resolver.assignPermission('', 'permission-1');

      expect(permissionService.assignPermission).toHaveBeenCalledWith('', 'permission-1');
    });

    it('should handle empty permissionId', async () => {
      permissionService.assignPermission.mockResolvedValue(mockRole);

      const result = await resolver.assignPermission('role-1', '');

      expect(permissionService.assignPermission).toHaveBeenCalledWith('role-1', '');
    });

    it('should handle very long roleId', async () => {
      const longRoleId = 'a'.repeat(1000);
      permissionService.assignPermission.mockResolvedValue(mockRole);

      const result = await resolver.assignPermission(longRoleId, 'permission-1');

      expect(permissionService.assignPermission).toHaveBeenCalledWith(longRoleId, 'permission-1');
    });

    it('should handle very long permissionId', async () => {
      const longPermissionId = 'a'.repeat(1000);
      permissionService.assignPermission.mockResolvedValue(mockRole);

      const result = await resolver.assignPermission('role-1', longPermissionId);

      expect(permissionService.assignPermission).toHaveBeenCalledWith('role-1', longPermissionId);
    });

    it('should handle special characters in roleId', async () => {
      const specialRoleId = 'role-1_@#$%^&*()';
      permissionService.assignPermission.mockResolvedValue(mockRole);

      const result = await resolver.assignPermission(specialRoleId, 'permission-1');

      expect(permissionService.assignPermission).toHaveBeenCalledWith(specialRoleId, 'permission-1');
    });

    it('should handle special characters in permissionId', async () => {
      const specialPermissionId = 'permission-1_@#$%^&*()';
      permissionService.assignPermission.mockResolvedValue(mockRole);

      const result = await resolver.assignPermission('role-1', specialPermissionId);

      expect(permissionService.assignPermission).toHaveBeenCalledWith('role-1', specialPermissionId);
    });

    it('should handle assigning same permission multiple times (idempotent)', async () => {
      permissionService.assignPermission.mockResolvedValue(mockRole);

      const result1 = await resolver.assignPermission('role-1', 'permission-1');
      const result2 = await resolver.assignPermission('role-1', 'permission-1');

      expect(permissionService.assignPermission).toHaveBeenCalledTimes(2);
      expect(result1).toEqual(result2);
    });
  });

  describe('removePermission mutation', () => {
    it('should call service removePermission with correct roleId and permissionId', async () => {
      permissionService.removePermission.mockResolvedValue(mockRole);

      const result = await resolver.removePermission('role-1', 'permission-1');

      expect(permissionService.removePermission).toHaveBeenCalledWith(
        'role-1',
        'permission-1',
      );
      expect(result).toEqual({
        statusCode: 200,
        message: 'Permission removed successfully',
        data: true,
      });
    });


    it('should handle empty roleId', async () => {
      permissionService.removePermission.mockResolvedValue(mockRole);

      const result = await resolver.removePermission('', 'permission-1');

      expect(permissionService.removePermission).toHaveBeenCalledWith('', 'permission-1');
    });

    it('should handle empty permissionId', async () => {
      permissionService.removePermission.mockResolvedValue(mockRole);

      const result = await resolver.removePermission('role-1', '');

      expect(permissionService.removePermission).toHaveBeenCalledWith('role-1', '');
    });

    it('should handle very long roleId', async () => {
      const longRoleId = 'a'.repeat(1000);
      permissionService.removePermission.mockResolvedValue(mockRole);

      const result = await resolver.removePermission(longRoleId, 'permission-1');

      expect(permissionService.removePermission).toHaveBeenCalledWith(longRoleId, 'permission-1');
    });

    it('should handle very long permissionId', async () => {
      const longPermissionId = 'a'.repeat(1000);
      permissionService.removePermission.mockResolvedValue(mockRole);

      const result = await resolver.removePermission('role-1', longPermissionId);

      expect(permissionService.removePermission).toHaveBeenCalledWith('role-1', longPermissionId);
    });

    it('should handle special characters in roleId', async () => {
      const specialRoleId = 'role-1_@#$%^&*()';
      permissionService.removePermission.mockResolvedValue(mockRole);

      const result = await resolver.removePermission(specialRoleId, 'permission-1');

      expect(permissionService.removePermission).toHaveBeenCalledWith(specialRoleId, 'permission-1');
    });

    it('should handle special characters in permissionId', async () => {
      const specialPermissionId = 'permission-1_@#$%^&*()';
      permissionService.removePermission.mockResolvedValue(mockRole);

      const result = await resolver.removePermission('role-1', specialPermissionId);

      expect(permissionService.removePermission).toHaveBeenCalledWith('role-1', specialPermissionId);
    });

    it('should handle removing non-existent permission (no-op)', async () => {
      permissionService.removePermission.mockResolvedValue(mockRole);

      const result = await resolver.removePermission('role-1', 'permission-1');

      expect(permissionService.removePermission).toHaveBeenCalledWith('role-1', 'permission-1');
    });

    it('should handle removing same permission multiple times (idempotent)', async () => {
      permissionService.removePermission.mockResolvedValue(mockRole);

      const result1 = await resolver.removePermission('role-1', 'permission-1');
      const result2 = await resolver.removePermission('role-1', 'permission-1');

      expect(permissionService.removePermission).toHaveBeenCalledTimes(2);
      expect(result1).toEqual(result2);
    });
  });

  describe('getPermissionByRole query', () => {
    it('should return permissions for a role', async () => {
      const permissions = [mockPermission];
      permissionService.getPermissionByRole.mockResolvedValue(permissions);

      const result = await resolver.getPermissionByRole('role-1');

      expect(permissionService.getPermissionByRole).toHaveBeenCalledWith('role-1');
      expect(result).toEqual({
        statusCode: 200,
        message: 'Permissions retrieved successfully',
        data: permissions,
      });
    });


    it('should handle empty roleId', async () => {
      permissionService.getPermissionByRole.mockResolvedValue([]);

      const result = await resolver.getPermissionByRole('');

      expect(permissionService.getPermissionByRole).toHaveBeenCalledWith('');
    });

    it('should handle very long roleId', async () => {
      const longRoleId = 'a'.repeat(1000);
      permissionService.getPermissionByRole.mockResolvedValue([]);

      const result = await resolver.getPermissionByRole(longRoleId);

      expect(permissionService.getPermissionByRole).toHaveBeenCalledWith(longRoleId);
    });

    it('should handle special characters in roleId', async () => {
      const specialRoleId = 'role-1_@#$%^&*()';
      permissionService.getPermissionByRole.mockResolvedValue([]);

      const result = await resolver.getPermissionByRole(specialRoleId);

      expect(permissionService.getPermissionByRole).toHaveBeenCalledWith(specialRoleId);
    });

    it('should handle role with no permissions', async () => {
      permissionService.getPermissionByRole.mockResolvedValue([]);

      const result = await resolver.getPermissionByRole('role-1');

      expect(result.data).toEqual([]);
    });

    it('should handle role with multiple permissions', async () => {
      const permissions = [
        mockPermission,
        { ...mockPermission, id: 'permission-2', name: 'UPDATE_PRODUCT' },
        { ...mockPermission, id: 'permission-3', name: 'DELETE_PRODUCT' },
      ];
      permissionService.getPermissionByRole.mockResolvedValue(permissions);

      const result = await resolver.getPermissionByRole('role-1');

      expect(result.data.length).toBe(3);
    });

    it('should handle role with very large number of permissions', async () => {
      const permissions = Array.from({ length: 100 }, (_, i) => ({
        ...mockPermission,
        id: `permission-${i}`,
        name: `PERMISSION_${i}`,
      }));
      permissionService.getPermissionByRole.mockResolvedValue(permissions);

      const result = await resolver.getPermissionByRole('role-1');

      expect(result.data.length).toBe(100);
    });
  });
});
