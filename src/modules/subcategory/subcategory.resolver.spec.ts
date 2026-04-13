import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import request from 'supertest';
import { SubCategoryResolver } from './Subcategory.resolver';
import { SubCategoryService } from './subcategory.service';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

const mockCategory = {
  id: 'category-id',
  name: 'Beverages',
};

const mockSubCategory = {
  id: 'subcategory-id',
  name: 'Cold Drinks',
  category: mockCategory,
};

describe('SubCategoryResolver (feature)', () => {
  let app: INestApplication;
  let service: {
    createSubcategory: jest.Mock;
    findAllSubcategory: jest.Mock;
    findOneSubcategory: jest.Mock;
    updateSubcategory: jest.Mock;
    deleteSubcategory: jest.Mock;
  };

  beforeAll(async () => {
    service = {
      createSubcategory: jest.fn(),
      findAllSubcategory: jest.fn(),
      findOneSubcategory: jest.fn(),
      updateSubcategory: jest.fn(),
      deleteSubcategory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/graphql',
          context: ({ req }) => ({ req: { ...req, user: { userId: 'user-id', role: 'admin', permissions: ['CREATE_SUBCATEGORY', 'UPDATE_SUBCATEGORY', 'DELETE_SUBCATEGORY'] } } }),
        }),
      ],
      providers: [
        SubCategoryResolver,
        {
          provide: SubCategoryService,
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

  it('should create a subcategory with required payload fields', async () => {
    service.createSubcategory.mockResolvedValue(mockSubCategory);

    const query = `mutation {
      createSubCategory(input: { name: "Cold Drinks", categoryId: "category-id" }) {
        id
        name
        category {
          id
          name
        }
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(service.createSubcategory).toHaveBeenCalledWith({ name: 'Cold Drinks', categoryId: 'category-id' });
    expect(response.body.data.createSubCategory).toEqual(mockSubCategory);
  });

  it('should fail validation when createSubCategory payload is missing fields', async () => {
    const query = `mutation {
      createSubCategory(input: { name: "Cold Drinks" }) {
        id
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(400);

    expect(response.body.data).toBeFalsy();
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain('Field "CreateSubCategoryInput.categoryId" of required type "String!" was not provided.');
    expect(service.createSubcategory).not.toHaveBeenCalled();
  });

  it('should return all subcategories and validate response structure', async () => {
    service.findAllSubcategory.mockResolvedValue([mockSubCategory]);

    const query = `query {
      getSubCategories {
        id
        name
        category {
          id
          name
        }
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(service.findAllSubcategory).toHaveBeenCalledTimes(1);
    expect(response.body.data.getSubCategories).toEqual([mockSubCategory]);
  });

  it('should return a subcategory by id and validate the id argument', async () => {
    service.findOneSubcategory.mockResolvedValue(mockSubCategory);

    const query = `query {
      getSubCategory(id: "subcategory-id") {
        id
        name
        category {
          id
          name
        }
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(service.findOneSubcategory).toHaveBeenCalledWith('subcategory-id');
    expect(response.body.data.getSubCategory).toEqual(mockSubCategory);
  });

  it('should fail GraphQL type validation when getSubCategory id is not a string', async () => {
    const query = `query {
      getSubCategory(id: 123) {
        id
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(400);

    expect(response.body.data).toBeFalsy();
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain('String cannot represent a non string value');
    expect(service.findOneSubcategory).not.toHaveBeenCalled();
  });

  it('should update subcategory with exact input payload and return updated item', async () => {
    const updatedSubCategory = { ...mockSubCategory, name: 'Hot Drinks' };
    service.updateSubcategory.mockResolvedValue(updatedSubCategory);

    const query = `mutation {
      updateSubCategory(input: { id: "subcategory-id", name: "Hot Drinks" }) {
        id
        name
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(service.updateSubcategory).toHaveBeenCalledWith({ id: 'subcategory-id', name: 'Hot Drinks' });
    expect(response.body.data.updateSubCategory).toEqual({ id: 'subcategory-id', name: 'Hot Drinks' });
  });

  it('should fail when updateSubCategory payload misses id', async () => {
    const query = `mutation {
      updateSubCategory(input: { name: "Hot Drinks" }) {
        id
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(400);

    expect(response.body.data).toBeFalsy();
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain('Field "UpdateSubCategoryInput.id" of required type "String!" was not provided.');
    expect(service.updateSubcategory).not.toHaveBeenCalled();
  });

  it('should delete subcategory by id and return removed entity', async () => {
    service.deleteSubcategory.mockResolvedValue(mockSubCategory);

    const query = `mutation {
      deleteSubCategory(id: "subcategory-id") {
        id
        name
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(service.deleteSubcategory).toHaveBeenCalledWith('subcategory-id');
    expect(response.body.data.deleteSubCategory).toEqual({ id: 'subcategory-id', name: 'Cold Drinks' });
  });

  it('should fail GraphQL validation for deleteSubCategory when id is missing', async () => {
    const query = `mutation {
      deleteSubCategory {
        id
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(400);

    expect(response.body.data).toBeFalsy();
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain('Field "deleteSubCategory" argument "id" of type "String!" is required');
    expect(service.deleteSubcategory).not.toHaveBeenCalled();
  });
});
