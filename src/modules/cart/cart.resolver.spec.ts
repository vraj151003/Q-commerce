import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import request from 'supertest';
import { CartResolver } from './cart.resolver';
import { CartService } from './cart.service';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

const mockCart = {
  id: 1,
  totalAmount: 50,
  totalItems: 1,
  items: [
    {
      id: 1,
      productId: 'prod-123',
      quantity: 1,
      price: 50,
      totalPrice: 50,
    },
  ],
};

describe('CartResolver (feature)', () => {
  let app: INestApplication;
  let service: {
    getMyCart: jest.Mock;
    addToCart: jest.Mock;
    updateItem: jest.Mock;
    removeItem: jest.Mock;
    clearCart: jest.Mock;
  };

  beforeAll(async () => {
    service = {
      getMyCart: jest.fn(),
      addToCart: jest.fn(),
      updateItem: jest.fn(),
      removeItem: jest.fn(),
      clearCart: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/graphql',
          context: ({ req }) => ({ req: { ...req, user: { userId: 'user-id' } } }),
        }),
      ],
      providers: [
        CartResolver,
        {
          provide: CartService,
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

  it('should fetch the current user cart', async () => {
    service.getMyCart.mockResolvedValue(mockCart);

    const query = `query {
      getCart {
        id
        totalAmount
        totalItems
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(service.getMyCart).toHaveBeenCalledWith({ userId: 'user-id' });
    expect(response.body.data.getCart).toEqual({ id: '1', totalAmount: 50, totalItems: 1 });
  });

  it('should add an item to the cart and return updated cart', async () => {
    service.addToCart.mockResolvedValue(mockCart);

    const query = `mutation {
      addToCart(input: { productId: "prod-123", quantity: 1, price: 50 }) {
        id
        totalAmount
        totalItems
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(service.addToCart).toHaveBeenCalledWith(
      { productId: 'prod-123', quantity: 1, price: 50 },
      { userId: 'user-id' },
    );
    expect(response.body.data.addToCart).toEqual({ id: '1', totalAmount: 50, totalItems: 1 });
  });

  it('should update a cart item quantity', async () => {
    service.updateItem.mockResolvedValue(mockCart);

    const query = `mutation {
      updateCartItem(productId: "prod-123", quantity: 2) {
        id
        totalAmount
        totalItems
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(service.updateItem).toHaveBeenCalledWith('prod-123', 2, { userId: 'user-id' });
    expect(response.body.data.updateCartItem).toEqual({ id: '1', totalAmount: 50, totalItems: 1 });
  });

  it('should remove a cart item by itemId', async () => {
    service.removeItem.mockResolvedValue(mockCart);

    const query = `mutation {
      removeCartItem(itemId: 1) {
        id
        totalAmount
        totalItems
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(service.removeItem).toHaveBeenCalledWith(1, { userId: 'user-id' });
    expect(response.body.data.removeCartItem).toEqual({ id: '1', totalAmount: 50, totalItems: 1 });
  });

  it('should clear the cart and return true', async () => {
    service.clearCart.mockResolvedValue({});

    const query = `mutation {
      clearCart
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(service.clearCart).toHaveBeenCalledWith({ userId: 'user-id' });
    expect(response.body.data.clearCart).toBe(true);
  });

  it('should validate addToCart input fields and fail when missing required values', async () => {
    const query = `mutation {
      addToCart(input: { productId: "prod-123", quantity: 1 }) {
        id
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(400);

    expect(response.body.data).toBeFalsy();
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain('Field "AddToCartInput.price" of required type "Float!" was not provided.');
    expect(service.addToCart).not.toHaveBeenCalled();
  });

  it('should reject invalid itemId type for removeCartItem', async () => {
    const query = `mutation {
      removeCartItem(itemId: "not-a-number") {
        id
      }
    }`;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(400);

    expect(response.body.data).toBeFalsy();
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain('cannot represent non numeric value');
    expect(service.removeItem).not.toHaveBeenCalled();
  });
});
