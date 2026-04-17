import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import request from 'supertest';
import { CouponResolver } from './coupon.resolver';
import { CouponService } from './coupon.service';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { registerEnumType } from '@nestjs/graphql';
import { DiscountType } from 'src/common/constant/status';
import { Coupon } from './entity/coupon.entity';

registerEnumType(DiscountType, {
  name: 'DiscountType',
});

const mockCoupon = {
  id: '1',
  code: 'SAVE10',
  discountType: DiscountType.PERCENTAGE,
  discountValue: 10,
  maxDiscountAmount: 50,
  minOrderAmount: 100,
  startDate: new Date('2024-01-01'),
  expiryDate: new Date('2025-12-31'),
  usageLimit: 100,
  usageCount: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCouponList = [mockCoupon];

describe('CouponResolver (feature)', () => {
  let app: INestApplication;
  let service: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    findByCode: jest.Mock;
    createCoupon: jest.Mock;
    updateCoupon: jest.Mock;
    deleteCoupon: jest.Mock;
    applyCoupon: jest.Mock;
  };

  beforeAll(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByCode: jest.fn(),
      createCoupon: jest.fn(),
      updateCoupon: jest.fn(),
      deleteCoupon: jest.fn(),
      applyCoupon: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/graphql',
          context: ({ req }) => ({ req: { ...req, user: { userId: 'user-1', role: 'admin' } } }),
        }),
      ],
      providers: [
        CouponResolver,
        {
          provide: CouponService,
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

  describe('getCoupons', () => {
    it('should successfully return all coupons', async () => {
      service.findAll.mockResolvedValue(mockCouponList);

      const query = `
        query {
          getCoupons {
            id
            code
            discountType
            discountValue
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.getCoupons).toHaveLength(1);
      expect(response.body.data.getCoupons[0]).toMatchObject({
        id: '1',
        code: 'SAVE10',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
      });
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should propagate errors from service', async () => {
      service.findAll.mockRejectedValue(new Error('Service error'));

      const query = `
        query {
          getCoupons {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('getCoupon', () => {
    it('should successfully return a single coupon', async () => {
      service.findOne.mockResolvedValue(mockCoupon);

      const query = `
        query {
          getCoupon(id: "1") {
            id
            code
            discountType
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.getCoupon).toMatchObject({
        id: '1',
        code: 'SAVE10',
        discountType: DiscountType.PERCENTAGE,
      });
      expect(service.findOne).toHaveBeenCalledWith('1');
    });

    it('should propagate errors from service', async () => {
      service.findOne.mockRejectedValue(new Error('Service error'));

      const query = `
        query {
          getCoupon(id: "1") {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('getCouponByCode', () => {
    it('should successfully return coupon by code', async () => {
      service.findByCode.mockResolvedValue(mockCoupon);

      const query = `
        query {
          getCouponByCode(code: "SAVE10") {
            id
            code
            discountType
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.getCouponByCode).toMatchObject({
        id: '1',
        code: 'SAVE10',
        discountType: DiscountType.PERCENTAGE,
      });
      expect(service.findByCode).toHaveBeenCalledWith('SAVE10');
    });

    it('should propagate errors from service', async () => {
      service.findByCode.mockRejectedValue(new Error('Service error'));

      const query = `
        query {
          getCouponByCode(code: "SAVE10") {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('createCoupon', () => {
    it('should successfully create a coupon', async () => {
      service.createCoupon.mockResolvedValue(mockCoupon);

      const query = `
        mutation {
          createCoupon(input: {
            code: "SAVE10"
            discountType: PERCENTAGE
            discountValue: 10
            maxDiscountAmount: 50
            minOrderAmount: 100
          }) {
            id
            code
            discountType
            discountValue
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.createCoupon).toMatchObject({
        id: '1',
        code: 'SAVE10',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
      });
      expect(service.createCoupon).toHaveBeenCalled();
    });

    it('should propagate errors from service', async () => {
      service.createCoupon.mockRejectedValue(new Error('Service error'));

      const query = `
        mutation {
          createCoupon(input: {
            code: "SAVE10"
            discountType: PERCENTAGE
            discountValue: 10
          }) {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('updateCoupon', () => {
    it('should successfully update a coupon', async () => {
      service.updateCoupon.mockResolvedValue({
        ...mockCoupon,
        discountValue: 20,
      });

      const query = `
        mutation {
          updateCoupon(id: "1", input: {
            discountValue: 20
          }) {
            id
            code
            discountValue
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.updateCoupon).toMatchObject({
        id: '1',
        code: 'SAVE10',
        discountValue: 20,
      });
      expect(service.updateCoupon).toHaveBeenCalledWith('1', { discountValue: 20 });
    });

    it('should propagate errors from service', async () => {
      service.updateCoupon.mockRejectedValue(new Error('Service error'));

      const query = `
        mutation {
          updateCoupon(id: "1", input: {
            discountValue: 20
          }) {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('deleteCoupon', () => {
    it('should successfully delete a coupon', async () => {
      service.deleteCoupon.mockResolvedValue(undefined);

      const query = `
        mutation {
          deleteCoupon(id: "1")
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.deleteCoupon).toBe(true);
      expect(service.deleteCoupon).toHaveBeenCalledWith('1');
    });

    it('should propagate errors from service', async () => {
      service.deleteCoupon.mockRejectedValue(new Error('Service error'));

      const query = `
        mutation {
          deleteCoupon(id: "1")
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('applyCoupon', () => {
    it('should successfully apply a coupon', async () => {
      service.applyCoupon.mockResolvedValue({
        coupon: mockCoupon,
        discountAmount: 10,
        finalAmount: 90,
      });

      const query = `
        mutation {
          applyCoupon(input: {
            code: "SAVE10"
            orderAmount: 100
          }) {
            coupon {
              id
              code
            }
            discountAmount
            finalAmount
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.applyCoupon).toMatchObject({
        coupon: { id: '1', code: 'SAVE10' },
        discountAmount: 10,
        finalAmount: 90,
      });
      expect(service.applyCoupon).toHaveBeenCalledWith({ code: 'SAVE10', orderAmount: 100 });
    });

    it('should propagate errors from service', async () => {
      service.applyCoupon.mockRejectedValue(new Error('Service error'));

      const query = `
        mutation {
          applyCoupon(input: {
            code: "SAVE10"
            orderAmount: 100
          }) {
            coupon {
              id
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query });

      expect(response.body.errors).toBeDefined();
    });
  });
});
