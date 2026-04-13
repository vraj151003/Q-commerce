import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import request from 'supertest';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../roles/entity/roles.entity';

const mockRole: Role = {
  id: 'role-id',
  name: 'admin',
  permissions: [],
};

const mockUser = {
  id: 'user-id',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  isVerified: true,
  adminApproved: false,
  mobile: '9999999999',
  createdAt: new Date(),
  role: mockRole,
};

const mockPaginatedResponse = {
  users: [mockUser],
  total: 1,
  page: 1,
  limit: 10,
  totalPages: 1,
};

describe('UsersResolver (feature)', () => {
  let app: INestApplication;
  let service: {
    getAllUsersPaginated: jest.Mock;
    getUserById: jest.Mock;
    updateUserProfile: jest.Mock;
  };

  beforeAll(async () => {
    service = {
      getAllUsersPaginated: jest.fn(),
      getUserById: jest.fn(),
      updateUserProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/graphql',
          context: ({ req }) => ({
            req: {
              ...req,
              user: { userId: 'user-id', role: 'admin' },
            },
          }),
        }),
      ],
      providers: [
        UsersResolver,
        {
          provide: UsersService,
          useValue: service,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve getAllUserProfiles with every filter field and return exact response shape', async () => {
    service.getAllUsersPaginated.mockResolvedValue(mockPaginatedResponse);

    const query = `query {
      getAllUserProfiles(filters: {
        page: 1
        limit: 10
        search: "jane"
        roleIds: ["role-1", "role-2"]
        isVerified: true
        adminApproved: false
        sortBy: "firstName"
        sortOrder: "ASC"
      }) {
        statusCode
        message
        data {
          total
          page
          limit
          totalPages
          users {
            id
            firstName
            lastName
            email
            isVerified
            adminApproved
            mobile
            createdAt
            role {
              id
              name
            }
          }
        }
      }
    }`;

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(service.getAllUsersPaginated).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: 'jane',
      roleIds: ['role-1', 'role-2'],
      isVerified: true,
      adminApproved: false,
      sortBy: 'firstName',
      sortOrder: 'ASC',
    });
    expect(response.body.data.getAllUserProfiles.statusCode).toBe(200);
    expect(response.body.data.getAllUserProfiles.data).toMatchObject({
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      users: [
        expect.objectContaining({
          id: 'user-id',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          isVerified: true,
          adminApproved: false,
          mobile: '9999999999',
          createdAt: mockUser.createdAt.toISOString(),
          role: { id: 'role-id', name: 'admin' },
        }),
      ],
    });
  });

  it('should send default filter object when getAllUserProfiles called without filters', async () => {
    service.getAllUsersPaginated.mockResolvedValue(mockPaginatedResponse);

    const query = `query {
      getAllUserProfiles {
        statusCode
        message
        data {
          total
          page
          limit
          totalPages
        }
      }
    }`;

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(service.getAllUsersPaginated).toHaveBeenCalledWith({});
    expect(response.body.data.getAllUserProfiles.statusCode).toBe(200);
  });

  it('should return user profile for getUserProfileById and validate id arg exactly', async () => {
    service.getUserById.mockResolvedValue(mockUser);

    const query = `query {
      getUserProfileById(id: "user-id") {
        statusCode
        message
        data {
          id
          firstName
          lastName
          email
          mobile
          isVerified
          adminApproved
        }
      }
    }`;

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(service.getUserById).toHaveBeenCalledWith('user-id');
    expect(response.body.data.getUserProfileById).toEqual({
      statusCode: 200,
      message: 'User retrieved successfully',
      data: {
        id: 'user-id',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        mobile: '9999999999',
        isVerified: true,
        adminApproved: false,
      },
    });
  });

  it('should fail GraphQL validation for getUserProfileById when id is not a string', async () => {
    const query = `query {
      getUserProfileById(id: 123) {
        statusCode
      }
    }`;

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query })
      .expect(400);

    expect(response.body.errors).toBeDefined();
    expect(response.body.data).toBeFalsy();
    expect(response.body.errors[0].message).toContain('String cannot represent a non string value');
    expect(service.getUserById).not.toHaveBeenCalled();
  });

  it('should update all profile fields via mutation and preserve exact payload shape', async () => {
    const updatedUser = { ...mockUser, firstName: 'Janet', lastName: 'Smith', mobile: '1112223334' };
    service.updateUserProfile.mockResolvedValue(updatedUser);

    const query = `mutation {
      updateUserProfile(input: {
        firstName: "Janet"
        lastName: "Smith"
        mobile: "1112223334"
        password: "new-password"
      }) {
        statusCode
        message
        data {
          id
          firstName
          lastName
          mobile
        }
      }
    }`;

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(service.updateUserProfile).toHaveBeenCalledWith('user-id', {
      firstName: 'Janet',
      lastName: 'Smith',
      mobile: '1112223334',
      password: 'new-password',
    });
    expect(response.body.data.updateUserProfile).toEqual({
      statusCode: 200,
      message: 'User profile updated successfully',
      data: {
        id: 'user-id',
        firstName: 'Janet',
        lastName: 'Smith',
        mobile: '1112223334',
      },
    });
  });

  it('should fail when updateUserProfile input payload is missing required argument', async () => {
    const query = `mutation {
      updateUserProfile {
        statusCode
      }
    }`;

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query })
      .expect(400);

    expect(response.body.errors).toBeDefined();
    expect(response.body.data).toBeFalsy();
    expect(response.body.errors[0].message).toContain('Field "updateUserProfile" argument "input" of type "UpdateUserProfileInput!" is required');
    expect(service.updateUserProfile).not.toHaveBeenCalled();
  });
});
