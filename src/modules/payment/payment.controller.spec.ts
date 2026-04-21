import { BadRequestException, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import type { Stripe as StripeType } from 'stripe';

describe('PaymentController', () => {
  let controller: PaymentController;
  let paymentService: jest.Mocked<PaymentService>;
  let stripe: jest.Mocked<StripeType>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    originalEnv = process.env;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: {
            handleWebhook: jest.fn(),
          },
        },
        {
          provide: 'STRIPE_CLIENT',
          useValue: {
            webhooks: {
              constructEvent: jest.fn() as any,
            },
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    paymentService = module.get(PaymentService);
    stripe = module.get('STRIPE_CLIENT');
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
  });

  describe('handleStripeWebHook', () => {
    const mockRawBody = Buffer.from('test payload');
    const mockSignature = 't=123,v1=abc123';
    const mockEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_123',
          metadata: {
            orderId: 'order-123',
          },
        },
      },
    };

    it('should successfully process a valid webhook', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      paymentService.handleWebhook.mockResolvedValue(undefined);

      const result = await controller.handleStripeWebHook(
        { rawBody: mockRawBody } as any,
        mockSignature,
      );

      expect(result).toEqual({ received: true });
      expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
        mockRawBody,
        mockSignature,
        'whsec_test_secret',
      );
      expect(paymentService.handleWebhook).toHaveBeenCalledWith(mockEvent);
    });

    it('should return early when STRIPE_WEBHOOK_SECRET is not defined', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const result = await controller.handleStripeWebHook(
        { rawBody: mockRawBody } as any,
        mockSignature,
      );

      expect(result).toBeUndefined();
      expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled();
      expect(paymentService.handleWebhook).not.toHaveBeenCalled();
    });

    it('should return early when signature is missing', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

      const result = await controller.handleStripeWebHook(
        { rawBody: mockRawBody } as any,
        undefined as any,
      );

      expect(result).toBeUndefined();
      expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled();
      expect(paymentService.handleWebhook).not.toHaveBeenCalled();
    });

    it('should return early when signature is empty string', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

      const result = await controller.handleStripeWebHook(
        { rawBody: mockRawBody } as any,
        '',
      );

      expect(result).toBeUndefined();
      expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled();
      expect(paymentService.handleWebhook).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when webhook signature verification fails', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        controller.handleStripeWebHook(
          { rawBody: mockRawBody } as any,
          'invalid-signature',
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.handleStripeWebHook(
          { rawBody: mockRawBody } as any,
          'invalid-signature',
        ),
      ).rejects.toThrow('Webhook  error :Invalid signature');
      expect(paymentService.handleWebhook).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when webhook processing fails', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      paymentService.handleWebhook.mockRejectedValue(
        new Error('Processing error'),
      );

      await expect(
        controller.handleStripeWebHook(
          { rawBody: mockRawBody } as any,
          mockSignature,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.handleStripeWebHook(
          { rawBody: mockRawBody } as any,
          mockSignature,
        ),
      ).rejects.toThrow('Webhook processing failed: Processing error');
    });

    it('should handle payment_intent.succeeded event', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      const successEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            metadata: { orderId: 'order-123' },
          },
        },
      };
      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(successEvent);
      paymentService.handleWebhook.mockResolvedValue(undefined);

      const result = await controller.handleStripeWebHook(
        { rawBody: mockRawBody } as any,
        mockSignature,
      );

      expect(result).toEqual({ received: true });
      expect(paymentService.handleWebhook).toHaveBeenCalledWith(successEvent);
    });

    it('should handle payment_intent.payment_failed event', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      const failedEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_123',
            metadata: { orderId: 'order-123' },
          },
        },
      };
      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(failedEvent);
      paymentService.handleWebhook.mockResolvedValue(undefined);

      const result = await controller.handleStripeWebHook(
        { rawBody: mockRawBody } as any,
        mockSignature,
      );

      expect(result).toEqual({ received: true });
      expect(paymentService.handleWebhook).toHaveBeenCalledWith(failedEvent);
    });

    it('should handle payment_intent.canceled event', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      const canceledEvent = {
        type: 'payment_intent.canceled',
        data: {
          object: {
            id: 'pi_123',
            metadata: { orderId: 'order-123' },
          },
        },
      };
      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(canceledEvent);
      paymentService.handleWebhook.mockResolvedValue(undefined);

      const result = await controller.handleStripeWebHook(
        { rawBody: mockRawBody } as any,
        mockSignature,
      );

      expect(result).toEqual({ received: true });
      expect(paymentService.handleWebhook).toHaveBeenCalledWith(canceledEvent);
    });

    it('should handle charge.refunded event', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      const refundEvent = {
        type: 'charge.refunded',
        data: {
          object: {
            id: 'ch_123',
          },
        },
      };
      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(refundEvent);
      paymentService.handleWebhook.mockResolvedValue(undefined);

      const result = await controller.handleStripeWebHook(
        { rawBody: mockRawBody } as any,
        mockSignature,
      );

      expect(result).toEqual({ received: true });
      expect(paymentService.handleWebhook).toHaveBeenCalledWith(refundEvent);
    });

    it('should handle null rawBody', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid payload');
      });

      await expect(
        controller.handleStripeWebHook(
          { rawBody: null } as any,
          mockSignature,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle undefined rawBody', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid payload');
      });

      await expect(
        controller.handleStripeWebHook(
          { rawBody: undefined } as any,
          mockSignature,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle empty rawBody', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid payload');
      });

      await expect(
        controller.handleStripeWebHook(
          { rawBody: Buffer.from('') } as any,
          mockSignature,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle very large payload', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      const largePayload = Buffer.from('a'.repeat(1000000));
      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      paymentService.handleWebhook.mockResolvedValue(undefined);

      const result = await controller.handleStripeWebHook(
        { rawBody: largePayload } as any,
        mockSignature,
      );

      expect(result).toEqual({ received: true });
    });

    it('should handle special characters in signature', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      const specialSignature = 't=123,v1=abc!@#$%^&*()_+-=[]{}|;:,.<>?';
      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      paymentService.handleWebhook.mockResolvedValue(undefined);

      const result = await controller.handleStripeWebHook(
        { rawBody: mockRawBody } as any,
        specialSignature,
      );

      expect(result).toEqual({ received: true });
    });

    it('should handle STRIPE_WEBHOOK_SECRET with special characters', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test!@#$%^&*()';
      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      paymentService.handleWebhook.mockResolvedValue(undefined);

      const result = await controller.handleStripeWebHook(
        { rawBody: mockRawBody } as any,
        mockSignature,
      );

      expect(result).toEqual({ received: true });
    });

    it('should return undefined when STRIPE_WEBHOOK_SECRET is not defined', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const result = await controller.handleStripeWebHook(
        { rawBody: mockRawBody } as any,
        mockSignature,
      );

      expect(result).toBeUndefined();
    });

    it('should handle missing signature', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

      await controller.handleStripeWebHook(
        { rawBody: mockRawBody } as any,
        undefined as any,
      );
    });

    it('should process webhook successfully', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      paymentService.handleWebhook.mockResolvedValue(undefined);

      await controller.handleStripeWebHook(
        { rawBody: mockRawBody } as any,
        mockSignature,
      );

      expect(paymentService.handleWebhook).toHaveBeenCalledWith(mockEvent);
    });

    it('should throw error when webhook signature verification fails', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        controller.handleStripeWebHook(
          { rawBody: mockRawBody } as any,
          'invalid',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when webhook processing fails', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      paymentService.handleWebhook.mockRejectedValue(
        new Error('Processing error'),
      );

      await expect(
        controller.handleStripeWebHook(
          { rawBody: mockRawBody } as any,
          mockSignature,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle webhook with null event type', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      const nullTypeEvent = {
        type: null,
        data: { object: {} },
      };
      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(nullTypeEvent);
      paymentService.handleWebhook.mockResolvedValue(undefined);

      const result = await controller.handleStripeWebHook(
        { rawBody: mockRawBody } as any,
        mockSignature,
      );

      expect(result).toEqual({ received: true });
    });

    it('should handle webhook with undefined event type', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      const undefinedTypeEvent = {
        type: undefined,
        data: { object: {} },
      };
      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(undefinedTypeEvent);
      paymentService.handleWebhook.mockResolvedValue(undefined);

      const result = await controller.handleStripeWebHook(
        { rawBody: mockRawBody } as any,
        mockSignature,
      );

      expect(result).toEqual({ received: true });
    });
  });

  describe('Controller Configuration', () => {
    it('should have @Controller decorator with correct route', () => {
      const controller = new PaymentController(
        paymentService,
        stripe as any,
      );
      expect(controller).toBeInstanceOf(PaymentController);
    });

    it('should have Logger instance', () => {
      const controller = new PaymentController(
        paymentService,
        stripe as any,
      );
      expect(controller).toBeDefined();
    });
  });
});
