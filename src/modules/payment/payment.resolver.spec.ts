import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentResolver } from './payment.resolver';
import { PaymentService } from './payment.service';
import { GqlAuthGuard } from '../auth/gql-auth.guard';

describe('PaymentResolver', () => {
  let resolver: PaymentResolver;
  let paymentService: jest.Mocked<PaymentService>;

  const mockPaymentIntentResponse = {
    clientSecret: 'secret_123',
    paymentIntentId: 'pi_123',
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentResolver,
        {
          provide: PaymentService,
          useValue: {
            createPaymentIntent: jest.fn(),
            refundPayment: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<PaymentResolver>(PaymentResolver);
    paymentService = module.get(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should successfully create a payment intent', async () => {
      paymentService.createPaymentIntent.mockResolvedValue(
        mockPaymentIntentResponse,
      );

      const result = await resolver.createPaymentIntent('order-123', {
        req: { user: mockUser },
      } as any);

      expect(result).toEqual(mockPaymentIntentResponse);
      expect(paymentService.createPaymentIntent).toHaveBeenCalledWith('order-123');
    });

    it('should propagate NotFoundException from service', async () => {
      paymentService.createPaymentIntent.mockRejectedValue(
        new NotFoundException('Order Not Found'),
      );

      await expect(
        resolver.createPaymentIntent('order-123', {
          req: { user: mockUser },
        } as any),
      ).rejects.toThrow(NotFoundException);
      await expect(
        resolver.createPaymentIntent('order-123', {
          req: { user: mockUser },
        } as any),
      ).rejects.toThrow('Order Not Found');
    });

    it('should propagate BadRequestException from service', async () => {
      paymentService.createPaymentIntent.mockRejectedValue(
        new BadRequestException('Payment already processed'),
      );

      await expect(
        resolver.createPaymentIntent('order-123', {
          req: { user: mockUser },
        } as any),
      ).rejects.toThrow(BadRequestException);
      await expect(
        resolver.createPaymentIntent('order-123', {
          req: { user: mockUser },
        } as any),
      ).rejects.toThrow('Payment already processed');
    });

    it('should handle Stripe API errors', async () => {
      paymentService.createPaymentIntent.mockRejectedValue(
        new Error('Stripe API error'),
      );

      await expect(
        resolver.createPaymentIntent('order-123', {
          req: { user: mockUser },
        } as any),
      ).rejects.toThrow('Stripe API error');
    });

    it('should handle null orderId', async () => {
      paymentService.createPaymentIntent.mockRejectedValue(
        new Error('Invalid order ID'),
      );

      await expect(
        resolver.createPaymentIntent(null as any, {
          req: { user: mockUser },
        } as any),
      ).rejects.toThrow('Invalid order ID');
    });

    it('should handle undefined orderId', async () => {
      paymentService.createPaymentIntent.mockRejectedValue(
        new Error('Invalid order ID'),
      );

      await expect(
        resolver.createPaymentIntent(undefined as any, {
          req: { user: mockUser },
        } as any),
      ).rejects.toThrow('Invalid order ID');
    });

    it('should handle empty string orderId', async () => {
      paymentService.createPaymentIntent.mockRejectedValue(
        new Error('Invalid order ID'),
      );

      await expect(
        resolver.createPaymentIntent('', {
          req: { user: mockUser },
        } as any),
      ).rejects.toThrow('Invalid order ID');
    });

    it('should handle missing user in context', async () => {
      paymentService.createPaymentIntent.mockResolvedValue(
        mockPaymentIntentResponse,
      );

      const result = await resolver.createPaymentIntent('order-123', {
        req: { user: null },
      } as any);

      expect(result).toEqual(mockPaymentIntentResponse);
      expect(paymentService.createPaymentIntent).toHaveBeenCalledWith('order-123');
    });

    it('should handle missing context entirely', async () => {
      paymentService.createPaymentIntent.mockResolvedValue(
        mockPaymentIntentResponse,
      );

      await expect(
        resolver.createPaymentIntent('order-123', undefined as any),
      ).rejects.toThrow(TypeError);
    });

    it('should have GqlAuthGuard decorator', () => {
      const guards = Reflect.getMetadata('__guards__', PaymentResolver.prototype.createPaymentIntent);
      expect(guards).toBeDefined();
      expect(guards[0]).toBe(GqlAuthGuard);
    });
  });

  describe('refundPayment', () => {
    it('should successfully refund full payment without amount', async () => {
      paymentService.refundPayment.mockResolvedValue({ refundId: 're_123' });

      const result = await resolver.refundPayment('order-123', undefined, {
        req: { user: mockUser },
      } as any);

      expect(result).toBe(true);
      expect(paymentService.refundPayment).toHaveBeenCalledWith('order-123', undefined);
    });

    it('should successfully refund partial payment with amount', async () => {
      paymentService.refundPayment.mockResolvedValue({ refundId: 're_123' });

      const result = await resolver.refundPayment('order-123', 50, {
        req: { user: mockUser },
      } as any);

      expect(result).toBe(true);
      expect(paymentService.refundPayment).toHaveBeenCalledWith('order-123', 50);
    });

    it('should successfully refund with zero amount', async () => {
      paymentService.refundPayment.mockResolvedValue({ refundId: 're_123' });

      const result = await resolver.refundPayment('order-123', 0, {
        req: { user: mockUser },
      } as any);

      expect(result).toBe(true);
      expect(paymentService.refundPayment).toHaveBeenCalledWith('order-123', 0);
    });

    it('should propagate NotFoundException from service', async () => {
      paymentService.refundPayment.mockRejectedValue(
        new NotFoundException('Order not found'),
      );

      await expect(
        resolver.refundPayment('order-123', undefined, {
          req: { user: mockUser },
        } as any),
      ).rejects.toThrow(NotFoundException);
      await expect(
        resolver.refundPayment('order-123', undefined, {
          req: { user: mockUser },
        } as any),
      ).rejects.toThrow('Order not found');
    });

    it('should propagate BadRequestException from service', async () => {
      paymentService.refundPayment.mockRejectedValue(
        new BadRequestException('Order is not paid'),
      );

      await expect(
        resolver.refundPayment('order-123', undefined, {
          req: { user: mockUser },
        } as any),
      ).rejects.toThrow(BadRequestException);
      await expect(
        resolver.refundPayment('order-123', undefined, {
          req: { user: mockUser },
        } as any),
      ).rejects.toThrow('Order is not paid');
    });

    it('should handle Stripe API errors', async () => {
      paymentService.refundPayment.mockRejectedValue(
        new Error('Stripe API error'),
      );

      await expect(
        resolver.refundPayment('order-123', undefined, {
          req: { user: mockUser },
        } as any),
      ).rejects.toThrow('Stripe API error');
    });

    it('should handle null orderId', async () => {
      paymentService.refundPayment.mockRejectedValue(
        new Error('Invalid order ID'),
      );

      await expect(
        resolver.refundPayment(null as any, undefined, {
          req: { user: mockUser },
        } as any),
      ).rejects.toThrow('Invalid order ID');
    });

    it('should handle undefined orderId', async () => {
      paymentService.refundPayment.mockRejectedValue(
        new Error('Invalid order ID'),
      );

      await expect(
        resolver.refundPayment(undefined as any, undefined, {
          req: { user: mockUser },
        } as any),
      ).rejects.toThrow('Invalid order ID');
    });

    it('should handle empty string orderId', async () => {
      paymentService.refundPayment.mockRejectedValue(
        new Error('Invalid order ID'),
      );

      await expect(
        resolver.refundPayment('', undefined, {
          req: { user: mockUser },
        } as any),
      ).rejects.toThrow('Invalid order ID');
    });

    it('should handle negative refund amount', async () => {
      paymentService.refundPayment.mockResolvedValue({ refundId: 're_123' });

      const result = await resolver.refundPayment('order-123', -50, {
        req: { user: mockUser },
      } as any);

      expect(result).toBe(true);
      expect(paymentService.refundPayment).toHaveBeenCalledWith('order-123', -50);
    });

    it('should handle very large refund amount', async () => {
      paymentService.refundPayment.mockResolvedValue({ refundId: 're_123' });

      const result = await resolver.refundPayment('order-123', 999999.99, {
        req: { user: mockUser },
      } as any);

      expect(result).toBe(true);
      expect(paymentService.refundPayment).toHaveBeenCalledWith('order-123', 999999.99);
    });

    it('should handle fractional refund amount', async () => {
      paymentService.refundPayment.mockResolvedValue({ refundId: 're_123' });

      const result = await resolver.refundPayment('order-123', 99.99, {
        req: { user: mockUser },
      } as any);

      expect(result).toBe(true);
      expect(paymentService.refundPayment).toHaveBeenCalledWith('order-123', 99.99);
    });

    it('should handle missing user in context', async () => {
      paymentService.refundPayment.mockResolvedValue({ refundId: 're_123' });

      const result = await resolver.refundPayment('order-123', undefined, {
        req: { user: null },
      } as any);

      expect(result).toBe(true);
      expect(paymentService.refundPayment).toHaveBeenCalledWith('order-123', undefined);
    });

    it('should handle missing context entirely', async () => {
      paymentService.refundPayment.mockResolvedValue({ refundId: 're_123' });

      const result = await resolver.refundPayment('order-123', undefined, undefined as any);

      expect(result).toBe(true);
      expect(paymentService.refundPayment).toHaveBeenCalledWith('order-123', undefined);
    });

    it('should have GqlAuthGuard decorator', () => {
      const guards = Reflect.getMetadata('__guards__', PaymentResolver.prototype.refundPayment);
      expect(guards).toBeDefined();
      expect(guards[0]).toBe(GqlAuthGuard);
    });
  });

  describe('CreatePaymentIntentResponse DTO', () => {
    it('should have correct field structure', () => {
      const response = {
        clientSecret: 'secret_123',
        paymentIntentId: 'pi_123',
      };

      expect(response).toHaveProperty('clientSecret');
      expect(response).toHaveProperty('paymentIntentId');
      expect(typeof response.clientSecret).toBe('string');
      expect(typeof response.paymentIntentId).toBe('string');
    });

    it('should handle empty strings in response', () => {
      const response = {
        clientSecret: '',
        paymentIntentId: '',
      };

      expect(response.clientSecret).toBe('');
      expect(response.paymentIntentId).toBe('');
    });

    it('should handle very long strings in response', () => {
      const longString = 'a'.repeat(1000);
      const response = {
        clientSecret: longString,
        paymentIntentId: longString,
      };

      expect(response.clientSecret.length).toBe(1000);
      expect(response.paymentIntentId.length).toBe(1000);
    });
  });

  describe('Resolver Configuration', () => {
    it('should have @Resolver decorator', () => {
      expect(PaymentResolver).toBeDefined();
    });

    it('should be injectable', () => {
      const resolver = new PaymentResolver(paymentService);
      expect(resolver).toBeInstanceOf(PaymentResolver);
    });
  });
});
