import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import request from 'supertest';
import { OrderResolver } from './order.resolver';
import { OrderService } from './order.service';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { registerEnumType } from '@nestjs/graphql';
import { paymentMethod, PaymentStatus, OrderStatus } from 'src/common/constant/status';

// Register enums for GraphQL schema in test context
registerEnumType(paymentMethod, {
  name: 'paymentMethod',
  description: 'Available payment methods for orders',
});

registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
  description: 'Payment status for orders',
});

const mockOrder = {
  id: 'order-id',
  totalAmount: 100,
  totalItems: 2,
  status: OrderStatus.PENDING,
  paymentStatus: PaymentStatus.PENDING,
  paymentMethod: paymentMethod.ONLINE_PAYMENT,
};

const mockOrderList = [mockOrder];

const mockBase64 = 'dGVzdC1iYXNlNjQ=';

describe('OrderResolver (feature)', () => {
  let app: INestApplication;
  let service: {
    createOrder: jest.Mock;
    findAll: jest.Mock;
    findMyOrders: jest.Mock;
    findOne: jest.Mock;
    generateOrderPdfBase64: jest.Mock;
    updateStatus: jest.Mock;
    getSellerOrders: jest.Mock;
    updateOrder: jest.Mock;
  };

  beforeAll(async () => {
    service = {
      createOrder: jest.fn(),
      findAll: jest.fn(),
      findMyOrders: jest.fn(),
      findOne: jest.fn(),
      generateOrderPdfBase64: jest.fn(),
      updateStatus: jest.fn(),
      getSellerOrders: jest.fn(),
      updateOrder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/graphql',
          context: ({ req }) => ({ req: { ...req, user: { userId: 'user-id', role: 'admin' } } }),
        }),
      ],
      providers: [
        OrderResolver,
        {
          provide: OrderService,
          useValue: service,
        },
      ],
    })
      .overrideGuard(GqlAuthGuard)
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

  it('should create an order and include required GraphQL fields', async () => {
    service.createOrder.mockResolvedValue(mockOrder);

    const query = `mutation {
      createOrder(input: {
        addressLine1: "123 Main St"
        addressLine2: "Apt 1"
        city: "Town"
        state: "State"
        country: "Country"
        pincode: "00000"
        paymentMethod: ONLINE_PAYMENT
      }) {
        id
        totalAmount
        status
        paymentStatus
        paymentMethod
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(service.createOrder).toHaveBeenCalledWith(
      { userId: 'user-id', role: 'admin' },
      expect.objectContaining({ addressLine1: '123 Main St', city: 'Town', paymentMethod: paymentMethod.ONLINE_PAYMENT }),
    );
    expect(response.body.data.createOrder).toEqual({ 
      id: 'order-id', 
      totalAmount: 100, 
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: paymentMethod.ONLINE_PAYMENT
    });
  });

  it('should fail validation when createOrder input misses required field', async () => {
    const query = `mutation {
      createOrder(input: {
        addressLine1: "123 Main St"
        state: "State"
        country: "Country"
      }) {
        id
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(400);

    expect(response.body.data).toBeFalsy();
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain('CreateOrderInput.city');
    expect(service.createOrder).not.toHaveBeenCalled();
  });

  it('should fail validation when createOrder input misses paymentMethod', async () => {
    const query = `mutation {
      createOrder(input: {
        addressLine1: "123 Main St"
        city: "Town"
        state: "State"
        country: "Country"
        pincode: "00000"
      }) {
        id
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(400);

    expect(response.body.data).toBeFalsy();
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain('CreateOrderInput.paymentMethod');
    expect(service.createOrder).not.toHaveBeenCalled();
  });
});
