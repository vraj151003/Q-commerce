import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import request from 'supertest';
import { TaxResolver } from './tax.resolver';
import { TaxService } from './tax.service';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

const mockCategory = {
  id: 'category-id',
  name: 'Electronics',
};

const mockTax = {
  id: 'tax-id',
  category: mockCategory,
  categoryId: 'category-id',
  taxRate: 18,
  description: 'Standard GST rate',
  isActive: true,
};

const updatedTax = {
  id: 'tax-id',
  category: mockCategory,
  categoryId: 'category-id',
  taxRate: 28,
  description: 'Increased GST rate',
  isActive: true,
};

describe('TaxResolver (feature)', () => {
  let app: INestApplication;
  let service: {
    createTax: jest.Mock;
    findAllTaxes: jest.Mock;
    findOneTax: jest.Mock;
    findTaxByCategory: jest.Mock;
    updateTax: jest.Mock;
    deleteTax: jest.Mock;
  };

  beforeAll(async () => {
    service = {
      createTax: jest.fn(),
      findAllTaxes: jest.fn(),
      findOneTax: jest.fn(),
      findTaxByCategory: jest.fn(),
      updateTax: jest.fn(),
      deleteTax: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/graphql',
          context: ({ req }) => ({ req: { ...req, user: { userId: 'user-id', role: 'admin', permissions: ['CREATE_TAX', 'UPDATE_TAX', 'DELETE_TAX'] } } }),
        }),
      ],
      providers: [
        TaxResolver,
        {
          provide: TaxService,
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

  describe('createTax', () => {
    it('should create tax with required fields', async () => {
      service.createTax.mockResolvedValue(mockTax);

      const query = `mutation {
        createTax(input: { categoryId: "category-id", taxRate: 18 }) {
          id
          category {
            id
            name
          }
          categoryId
          taxRate
          description
          isActive
        }
      }`;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(service.createTax).toHaveBeenCalledWith({ categoryId: 'category-id', taxRate: 18 });
      expect(response.body.data.createTax).toEqual({
        id: 'tax-id',
        category: mockCategory,
        categoryId: 'category-id',
        taxRate: 18,
        description: 'Standard GST rate',
        isActive: true,
      });
    });

    it('should create tax with optional description', async () => {
      service.createTax.mockResolvedValue(mockTax);

      const query = `mutation {
        createTax(input: { categoryId: "category-id", taxRate: 18, description: "Standard GST rate" }) {
          id
          category {
            id
            name
          }
          categoryId
          taxRate
          description
          isActive
        }
      }`;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(service.createTax).toHaveBeenCalledWith({
        categoryId: 'category-id',
        taxRate: 18,
        description: 'Standard GST rate',
      });
    });

    it('should fail when categoryId is missing', async () => {
      const query = `mutation {
        createTax(input: { taxRate: 18 }) {
          id
        }
      }`;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(400);

      expect(response.body.data).toBeFalsy();
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Field "CreateTaxInput.categoryId" of required type "String!" was not provided.');
      expect(service.createTax).not.toHaveBeenCalled();
    });

    it('should fail when taxRate is missing', async () => {
      const query = `mutation {
        createTax(input: { categoryId: "category-id" }) {
          id
        }
      }`;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(400);

      expect(response.body.data).toBeFalsy();
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Field "CreateTaxInput.taxRate" of required type "Float!" was not provided.');
      expect(service.createTax).not.toHaveBeenCalled();
    });
  });

  describe('getTaxes', () => {
    it('should return all taxes', async () => {
      service.findAllTaxes.mockResolvedValue([mockTax]);

      const query = `query {
        getTaxes {
          id
          category {
            id
            name
          }
          categoryId
          taxRate
          description
          isActive
        }
      }`;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(service.findAllTaxes).toHaveBeenCalledTimes(1);
      expect(response.body.data.getTaxes).toEqual([mockTax]);
    });

    it('should return empty array when no taxes exist', async () => {
      service.findAllTaxes.mockResolvedValue([]);

      const query = `query {
        getTaxes {
          id
          categoryId
          taxRate
        }
      }`;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.getTaxes).toEqual([]);
    });
  });

  describe('getTax', () => {
    it('should return tax by id', async () => {
      service.findOneTax.mockResolvedValue(mockTax);

      const query = `query {
        getTax(id: "tax-id") {
          id
          category {
            id
            name
          }
          categoryId
          taxRate
          description
          isActive
        }
      }`;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(service.findOneTax).toHaveBeenCalledWith('tax-id');
      expect(response.body.data.getTax).toEqual(mockTax);
    });

    it('should fail when tax not found', async () => {
      service.findOneTax.mockRejectedValue(new Error('Tax not found'));

      const query = `query {
        getTax(id: "non-existent-id") {
          id
        }
      }`;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

      expect(response.body.errors).toBeDefined();
      expect(service.findOneTax).toHaveBeenCalledWith('non-existent-id');
    });

    it('should reject invalid id type', async () => {
      const query = `query {
        getTax(id: 123) {
          id
        }
      }`;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(400);

      expect(response.body.data).toBeFalsy();
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('String cannot represent a non string value');
      expect(service.findOneTax).not.toHaveBeenCalled();
    });
  });

  describe('getTaxByCategory', () => {
    it('should return tax by category id', async () => {
      service.findTaxByCategory.mockResolvedValue(mockTax);

      const query = `query {
        getTaxByCategory(categoryId: "category-id") {
          id
          category {
            id
            name
          }
          categoryId
          taxRate
          description
          isActive
        }
      }`;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(service.findTaxByCategory).toHaveBeenCalledWith('category-id');
      expect(response.body.data.getTaxByCategory).toEqual(mockTax);
    });

    it('should return null when no tax found for category', async () => {
      service.findTaxByCategory.mockResolvedValue(null);

      const query = `query {
        getTaxByCategory(categoryId: "non-existent-category") {
          id
          categoryId
          taxRate
        }
      }`;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(service.findTaxByCategory).toHaveBeenCalledWith('non-existent-category');
      expect(response.body.data.getTaxByCategory).toBeNull();
    });

    it('should fail when categoryId is missing', async () => {
      const query = `query {
        getTaxByCategory {
          id
        }
      }`;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(400);

      expect(response.body.data).toBeFalsy();
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Field "getTaxByCategory" argument "categoryId" of type "String!" is required');
      expect(service.findTaxByCategory).not.toHaveBeenCalled();
    });
  });

  describe('updateTax', () => {
    it('should update tax rate', async () => {
      service.updateTax.mockResolvedValue(updatedTax);

      const query = `mutation {
        updateTax(input: { id: "tax-id", taxRate: 28 }) {
          id
          category {
            id
            name
          }
          categoryId
          taxRate
          description
          isActive
        }
      }`;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(service.updateTax).toHaveBeenCalledWith({ id: 'tax-id', taxRate: 28 });
      expect(response.body.data.updateTax).toEqual(updatedTax);
    });

    it('should update tax description', async () => {
      service.updateTax.mockResolvedValue(updatedTax);

      const query = `mutation {
        updateTax(input: { id: "tax-id", description: "Increased GST rate" }) {
          id
          description
        }
      }`;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(service.updateTax).toHaveBeenCalledWith({ id: 'tax-id', description: 'Increased GST rate' });
    });

    it('should update tax isActive status', async () => {
      service.updateTax.mockResolvedValue(updatedTax);

      const query = `mutation {
        updateTax(input: { id: "tax-id", isActive: false }) {
          id
          isActive
        }
      }`;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(service.updateTax).toHaveBeenCalledWith({ id: 'tax-id', isActive: false });
    });

    it('should update multiple fields', async () => {
      service.updateTax.mockResolvedValue(updatedTax);

      const query = `mutation {
        updateTax(input: { id: "tax-id", taxRate: 28, description: "Increased GST rate", isActive: true }) {
          id
          taxRate
          description
          isActive
        }
      }`;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(service.updateTax).toHaveBeenCalledWith({
        id: 'tax-id',
        taxRate: 28,
        description: 'Increased GST rate',
        isActive: true,
      });
    });

    it('should fail when id is missing', async () => {
      const query = `mutation {
        updateTax(input: { taxRate: 28 }) {
          id
        }
      }`;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(400);

      expect(response.body.data).toBeFalsy();
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Field "UpdateTaxInput.id" of required type "String!" was not provided.');
      expect(service.updateTax).not.toHaveBeenCalled();
    });
  });

  describe('deleteTax', () => {
    it('should delete tax by id', async () => {
      service.deleteTax.mockResolvedValue(true);

      const query = `mutation {
        deleteTax(id: "tax-id")
      }`;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(service.deleteTax).toHaveBeenCalledWith('tax-id');
      expect(response.body.data.deleteTax).toBe(true);
    });

    it('should fail when id is missing', async () => {
      const query = `mutation {
        deleteTax
      }`;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(400);

      expect(response.body.data).toBeFalsy();
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Field "deleteTax" argument "id" of type "String!" is required');
      expect(service.deleteTax).not.toHaveBeenCalled();
    });

    it('should fail when tax not found', async () => {
      service.deleteTax.mockRejectedValue(new Error('Tax not found'));

      const query = `mutation {
        deleteTax(id: "non-existent-id")
      }`;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

      expect(response.body.errors).toBeDefined();
      expect(service.deleteTax).toHaveBeenCalledWith('non-existent-id');
    });
  });
});
