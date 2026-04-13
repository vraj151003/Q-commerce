import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import request from 'supertest';
import { CategoryResolver } from './category.resolver';
import { CategoryService } from './category.service';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

const mockCategory = {
  id: 'category-id',
  name: 'Beverages',
  description: 'Drinks category',
  subCategories: [],
};

const updatedCategory = {
  id: 'category-id',
  name: 'Snacks',
  description: 'Packaged goods',
  subCategories: [],
};

describe('CategoryResolver (feature)', () => {
  let app: INestApplication;
  let service: {
    createCategory: jest.Mock;
    findAllCategory: jest.Mock;
    findOneCategory: jest.Mock;
    updateCategory: jest.Mock;
    deleteCategory: jest.Mock;
  };

  beforeAll(async () => {
    service = {
      createCategory: jest.fn(),
      findAllCategory: jest.fn(),
      findOneCategory: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/graphql',
          context: ({ req }) => ({ req: { ...req, user: { userId: 'user-id', role: 'admin', permissions: ['CREATE_CATEGORY', 'UPDATE_CATEGORY', 'DELETE_CATEGORY'] } } }),
        }),
      ],
      providers: [
        CategoryResolver,
        {
          provide: CategoryService,
          useValue: service,
        },
      ],
    })
      .overrideGuard(GqlAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PermissionsGuard)
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

  it('should create category with required payload and return full object', async () => {
    service.createCategory.mockResolvedValue(mockCategory);

    const query = `mutation {
      createCategory(input: { name: "Beverages", description: "Drinks category" }) {
        id
        name
        description
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(service.createCategory).toHaveBeenCalledWith({ name: 'Beverages', description: 'Drinks category' });
    expect(response.body.data.createCategory).toEqual({ id: 'category-id', name: 'Beverages', description: 'Drinks category' });
  });

  it('should fail when createCategory missing required name', async () => {
    const query = `mutation {
      createCategory(input: { description: "Drinks category" }) {
        id
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(400);

    expect(response.body.data).toBeFalsy();
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain('Field "CreateCategoryInput.name" of required type "String!" was not provided.');
    expect(service.createCategory).not.toHaveBeenCalled();
  });

  it('should list categories and validate response shape', async () => {
    service.findAllCategory.mockResolvedValue([mockCategory]);

    const query = `query {
      getCategories {
        id
        name
        description
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(service.findAllCategory).toHaveBeenCalledTimes(1);
    expect(response.body.data.getCategories).toEqual([{ id: 'category-id', name: 'Beverages', description: 'Drinks category' }]);
  });

  it('should return category by id and validate id argument', async () => {
    service.findOneCategory.mockResolvedValue(mockCategory);

    const query = `query {
      getCategory(id: "category-id") {
        id
        name
        description
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(service.findOneCategory).toHaveBeenCalledWith('category-id');
    expect(response.body.data.getCategory).toEqual({ id: 'category-id', name: 'Beverages', description: 'Drinks category' });
  });

  it('should reject invalid id type for getCategory', async () => {
    const query = `query {
      getCategory(id: 123) {
        id
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(400);

    expect(response.body.data).toBeFalsy();
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain('String cannot represent a non string value');
    expect(service.findOneCategory).not.toHaveBeenCalled();
  });

  it('should update category with exact payload and return updated values', async () => {
    service.updateCategory.mockResolvedValue(updatedCategory);

    const query = `mutation {
      updateCategory(input: { id: "category-id", name: "Snacks", description: "Packaged goods" }) {
        id
        name
        description
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(service.updateCategory).toHaveBeenCalledWith({ id: 'category-id', name: 'Snacks', description: 'Packaged goods' });
    expect(response.body.data.updateCategory).toEqual({
      id: 'category-id',
      name: 'Snacks',
      description: 'Packaged goods',
    });
  });

  it('should fail when updateCategory payload is missing id', async () => {
    const query = `mutation {
      updateCategory(input: { name: "Snacks" }) {
        id
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(400);

    expect(response.body.data).toBeFalsy();
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain('Field "UpdateCategoryInput.id" of required type "String!" was not provided.');
    expect(service.updateCategory).not.toHaveBeenCalled();
  });

  it('should delete category by id and return true', async () => {
    service.deleteCategory.mockResolvedValue(true);

    const query = `mutation {
      deleteCategory(id: "category-id")
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(service.deleteCategory).toHaveBeenCalledWith('category-id');
    expect(response.body.data.deleteCategory).toBe(true);
  });

  it('should fail when deleteCategory id is missing', async () => {
    const query = `mutation {
      deleteCategory
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(400);

    expect(response.body.data).toBeFalsy();
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain('Field "deleteCategory" argument "id" of type "String!" is required');
    expect(service.deleteCategory).not.toHaveBeenCalled();
  });
});
