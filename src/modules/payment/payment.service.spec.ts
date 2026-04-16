import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Order } from '../orders/entity/order.entity';
import { PaymentGateway } from './payment.gateway';
import { PaymentService } from './payment.service';
import { PaymentStatus } from 'src/common/constant/status';

describe('PaymentService', () => {
  let service: PaymentService;
  let orderRepo: jest.Mocked<Repository<Order>>;
  let stripe: jest.Mocked<any>;
  let paymentGateway: jest.Mocked<PaymentGateway>;

  const mockOrder = {
    id: 'order-123',
    totalAmount: 100,
    paymentStatus: PaymentStatus.PENDING,
    paymentIntentId: null,
    isPaid: false,
    user: { id: 'user-123', email: 'test@example.com' },
  };

  const mockPaymentIntent = {
    id: 'pi_123',
    client_secret: 'secret_123',
    status: 'succeeded',
    metadata: {
      orderId: 'order-123',
      userId: 'user-123',
    },
    last_payment_error: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Order),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn().mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] }),
          },
        },
        {
          provide: 'STRIPE_CLIENT',
          useValue: {
            paymentIntents: {
              create: jest.fn(),
              retrieve: jest.fn(),
            },
            refunds: {
              create: jest.fn(),
            },
            webhooks: {
              constructEvent: jest.fn(),
            },
          },
        },
        {
          provide: PaymentGateway,
          useValue: {
            notifyPaymentStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    orderRepo = module.get(getRepositoryToken(Order));
    stripe = module.get('STRIPE_CLIENT');
    paymentGateway = module.get(PaymentGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should successfully create a payment intent for a valid order', async () => {
      orderRepo.findOne.mockResolvedValue(mockOrder as any);
      stripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await service.createPaymentIntent('order-123');

      expect(result).toEqual({
        clientSecret: 'secret_123',
        paymentIntentId: 'pi_123',
      });
      expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 10000,
        currency: 'usd',
        metadata: {
          orderId: 'order-123',
          userId: 'user-123',
        },
        description: 'Payment for order order-123',
        automatic_payment_methods: {
          enabled: true,
        },
      });
      expect(orderRepo.update).toHaveBeenCalledWith('order-123', {
        paymentIntentId: 'pi_123',
        paymentStatus: PaymentStatus.PROCESSING,
      });
      expect(paymentGateway.notifyPaymentStatus).toHaveBeenCalledWith(
        'user-123',
        {
          orderId: 'order-123',
          status: PaymentStatus.PROCESSING.toString(),
          paymentIntentId: 'pi_123',
        },
      );
    });

    it('should throw NotFoundException when order does not exist', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.createPaymentIntent('non-existent-order')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createPaymentIntent('non-existent-order')).rejects.toThrow(
        'Order Not Found',
      );
      expect(stripe.paymentIntents.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when payment is already processed', async () => {
      const processedOrder = {
        ...mockOrder,
        paymentStatus: PaymentStatus.COMPLETED,
      };
      orderRepo.findOne.mockResolvedValue(processedOrder as any);

      await expect(service.createPaymentIntent('order-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createPaymentIntent('order-123')).rejects.toThrow(
        'payment already processed',
      );
      expect(stripe.paymentIntents.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when payment is in PROCESSING state', async () => {
      const processingOrder = {
        ...mockOrder,
        paymentStatus: PaymentStatus.PROCESSING,
      };
      orderRepo.findOne.mockResolvedValue(processingOrder as any);

      await expect(service.createPaymentIntent('order-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createPaymentIntent('order-123')).rejects.toThrow(
        'payment already processed',
      );
      expect(stripe.paymentIntents.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when payment is already REFUNDED', async () => {
      const refundedOrder = {
        ...mockOrder,
        paymentStatus: PaymentStatus.REFUNDED,
      };
      orderRepo.findOne.mockResolvedValue(refundedOrder as any);

      await expect(service.createPaymentIntent('order-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createPaymentIntent('order-123')).rejects.toThrow(
        'payment already processed',
      );
      expect(stripe.paymentIntents.create).not.toHaveBeenCalled();
    });

    it('should handle Stripe API error during payment intent creation', async () => {
      orderRepo.findOne.mockResolvedValue(mockOrder as any);
      stripe.paymentIntents.create.mockRejectedValue(
        new Error('Stripe API error'),
      );

      await expect(service.createPaymentIntent('order-123')).rejects.toThrow(
        'Stripe API error',
      );
      expect(orderRepo.update).not.toHaveBeenCalled();
    });

    it('should handle order with zero amount', async () => {
      const zeroAmountOrder = {
        ...mockOrder,
        totalAmount: 0,
      };
      orderRepo.findOne.mockResolvedValue(zeroAmountOrder as any);
      stripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      await service.createPaymentIntent('order-123');

      expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 0,
        }),
      );
    });

    it('should handle order with very large amount', async () => {
      const largeAmountOrder = {
        ...mockOrder,
        totalAmount: 999999.99,
      };
      orderRepo.findOne.mockResolvedValue(largeAmountOrder as any);
      stripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      await service.createPaymentIntent('order-123');

      expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 99999999,
        }),
      );
    });

    it('should handle order with fractional amount', async () => {
      const fractionalOrder = {
        ...mockOrder,
        totalAmount: 99.99,
      };
      orderRepo.findOne.mockResolvedValue(fractionalOrder as any);
      stripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      await service.createPaymentIntent('order-123');

      expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 9999,
        }),
      );
    });

    it('should throw error when orderId is null', async () => {
      orderRepo.findOne.mockResolvedValue(null);
      await expect(service.createPaymentIntent(null as any)).rejects.toThrow(NotFoundException);
      expect(orderRepo.findOne).toHaveBeenCalledWith({ where: { id: null }, relations: ['user'] });
    });

    it('should throw error when orderId is undefined', async () => {
      orderRepo.findOne.mockResolvedValue(null);
      await expect(service.createPaymentIntent(undefined as any)).rejects.toThrow(NotFoundException);
      expect(orderRepo.findOne).toHaveBeenCalledWith({ where: { id: undefined }, relations: ['user'] });
    });

    it('should throw error when orderId is empty string', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.createPaymentIntent('')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('confirnPayment', () => {
    it('should successfully confirm payment when payment intent is completed', async () => {
      stripe.paymentIntents.retrieve.mockResolvedValue({
        ...mockPaymentIntent,
        status: PaymentStatus.COMPLETED,
      });
      orderRepo.findOne.mockResolvedValue(mockOrder as any);

      const result = await service.confirnPayment('pi_123', 'order-123');

      expect(result).toEqual(mockOrder);
      expect(orderRepo.update).toHaveBeenCalledWith('order-123', {
        paymentStatus: PaymentStatus.COMPLETED,
        isPaid: true,
      });
      expect(paymentGateway.notifyPaymentStatus).toHaveBeenCalledWith(
        'user-123',
        {
          orderId: 'order-123',
          status: PaymentStatus.COMPLETED.toString(),
          paymentIntentId: 'pi_123',
        },
      );
    });

    it('should successfully confirm payment without orderId parameter', async () => {
      stripe.paymentIntents.retrieve.mockResolvedValue({
        ...mockPaymentIntent,
        status: PaymentStatus.COMPLETED,
      });
      orderRepo.findOne.mockResolvedValue(mockOrder as any);

      const result = await service.confirnPayment('pi_123');

      expect(result).toEqual(mockOrder);
      expect(orderRepo.update).toHaveBeenCalledWith('order-123', {
        paymentStatus: PaymentStatus.COMPLETED,
        isPaid: true,
      });
    });

    it('should throw BadRequestException when payment intent status is not completed', async () => {
      stripe.paymentIntents.retrieve.mockResolvedValue({
        ...mockPaymentIntent,
        status: 'pending',
      });

      await expect(service.confirnPayment('pi_123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.confirnPayment('pi_123')).rejects.toThrow(
        'Payment not successful. Status: pending',
      );
      expect(orderRepo.findOne).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when payment intent status is failed', async () => {
      stripe.paymentIntents.retrieve.mockResolvedValue({
        ...mockPaymentIntent,
        status: 'failed',
      });

      await expect(service.confirnPayment('pi_123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.confirnPayment('pi_123')).rejects.toThrow(
        'Payment not successful. Status: failed',
      );
    });

    it('should throw NotFoundException when order is not found for payment intent', async () => {
      stripe.paymentIntents.retrieve.mockResolvedValue({
        ...mockPaymentIntent,
        status: PaymentStatus.COMPLETED,
      });
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.confirnPayment('pi_123')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.confirnPayment('pi_123')).rejects.toThrow(
        'Order not found',
      );
    });

    it('should throw BadRequestException when payment intent does not belong to provided order', async () => {
      stripe.paymentIntents.retrieve.mockResolvedValue({
        ...mockPaymentIntent,
        status: PaymentStatus.COMPLETED,
      });
      orderRepo.findOne.mockResolvedValue(mockOrder as any);

      await expect(service.confirnPayment('pi_123', 'different-order')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.confirnPayment('pi_123', 'different-order')).rejects.toThrow(
        'Payment intent does not belong to this order',
      );
    });

    it('should handle Stripe API error during payment intent retrieval', async () => {
      stripe.paymentIntents.retrieve.mockRejectedValue(
        new Error('Stripe API error'),
      );

      await expect(service.confirnPayment('pi_123')).rejects.toThrow(
        'Stripe API error',
      );
      expect(orderRepo.findOne).not.toHaveBeenCalled();
    });

    it('should handle order update error', async () => {
      stripe.paymentIntents.retrieve.mockResolvedValue({
        ...mockPaymentIntent,
        status: PaymentStatus.COMPLETED,
      });
      orderRepo.findOne.mockResolvedValue(mockOrder as any);
      orderRepo.update.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.confirnPayment('pi_123')).rejects.toThrow(
        'Database error',
      );
    });

    it('should throw error when paymentIntentId is null', async () => {
      stripe.paymentIntents.retrieve.mockRejectedValue(new Error('Invalid ID'));
      await expect(service.confirnPayment(null as any)).rejects.toThrow('Invalid ID');
      expect(stripe.paymentIntents.retrieve).toHaveBeenCalledWith(null);
    });

    it('should throw error when paymentIntentId is undefined', async () => {
      stripe.paymentIntents.retrieve.mockRejectedValue(new Error('Invalid ID'));
      await expect(service.confirnPayment(undefined as any)).rejects.toThrow('Invalid ID');
      expect(stripe.paymentIntents.retrieve).toHaveBeenCalledWith(undefined);
    });

    it('should throw error when paymentIntentId is empty string', async () => {
      stripe.paymentIntents.retrieve.mockRejectedValue(new Error('Invalid ID'));

      await expect(service.confirnPayment('')).rejects.toThrow('Invalid ID');
    });
  });

  describe('refundPayment', () => {
    it('should successfully refund full payment', async () => {
      const paidOrder = {
        ...mockOrder,
        isPaid: true,
        paymentIntentId: 'pi_123',
        paymentStatus: PaymentStatus.COMPLETED,
      };
      orderRepo.findOne.mockResolvedValue(paidOrder as any);
      stripe.refunds.create.mockResolvedValue({ id: 're_123' });

      const result = await service.refundPayment('order-123');

      expect(result).toEqual({ refundId: 're_123' });
      expect(stripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        amount: undefined,
      });
      expect(orderRepo.update).toHaveBeenCalledWith('order-123', {
        paymentStatus: PaymentStatus.REFUNDED,
        isPaid: false,
      });
    });

    it('should successfully refund partial payment', async () => {
      const paidOrder = {
        ...mockOrder,
        isPaid: true,
        paymentIntentId: 'pi_123',
        paymentStatus: PaymentStatus.COMPLETED,
      };
      orderRepo.findOne.mockResolvedValue(paidOrder as any);
      stripe.refunds.create.mockResolvedValue({ id: 're_123' });

      const result = await service.refundPayment('order-123', 50);

      expect(result).toEqual({ refundId: 're_123' });
      expect(stripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        amount: 5000,
      });
    });

    it('should throw NotFoundException when order does not exist', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.refundPayment('non-existent-order')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.refundPayment('non-existent-order')).rejects.toThrow(
        'Order not found',
      );
      expect(stripe.refunds.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when order is not paid', async () => {
      const unpaidOrder = {
        ...mockOrder,
        isPaid: false,
        paymentIntentId: 'pi_123',
      };
      orderRepo.findOne.mockResolvedValue(unpaidOrder as any);

      await expect(service.refundPayment('order-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.refundPayment('order-123')).rejects.toThrow(
        'Order is not paid or missing payment intent',
      );
      expect(stripe.refunds.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when payment intent is missing', async () => {
      const orderWithoutPaymentIntent = {
        ...mockOrder,
        isPaid: true,
        paymentIntentId: null,
      };
      orderRepo.findOne.mockResolvedValue(orderWithoutPaymentIntent as any);

      await expect(service.refundPayment('order-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.refundPayment('order-123')).rejects.toThrow(
        'Order is not paid or missing payment intent',
      );
      expect(stripe.refunds.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when both isPaid and paymentIntentId are missing', async () => {
      const unpaidOrder = {
        ...mockOrder,
        isPaid: false,
        paymentIntentId: null,
      };
      orderRepo.findOne.mockResolvedValue(unpaidOrder as any);

      await expect(service.refundPayment('order-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.refundPayment('order-123')).rejects.toThrow(
        'Order is not paid or missing payment intent',
      );
      expect(stripe.refunds.create).not.toHaveBeenCalled();
    });

    it('should handle Stripe API error during refund creation', async () => {
      const paidOrder = {
        ...mockOrder,
        isPaid: true,
        paymentIntentId: 'pi_123',
      };
      orderRepo.findOne.mockResolvedValue(paidOrder as any);
      stripe.refunds.create.mockRejectedValue(new Error('Stripe API error'));

      await expect(service.refundPayment('order-123')).rejects.toThrow(
        'Stripe API error',
      );
      expect(orderRepo.update).not.toHaveBeenCalled();
    });

    it('should handle order update error', async () => {
      const paidOrder = {
        ...mockOrder,
        isPaid: true,
        paymentIntentId: 'pi_123',
      };
      orderRepo.findOne.mockResolvedValue(paidOrder as any);
      stripe.refunds.create.mockResolvedValue({ id: 're_123' });
      orderRepo.update.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.refundPayment('order-123')).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle partial refund with zero amount', async () => {
      const paidOrder = {
        ...mockOrder,
        isPaid: true,
        paymentIntentId: 'pi_123',
      };
      orderRepo.findOne.mockResolvedValue(paidOrder as any);
      stripe.refunds.create.mockResolvedValue({ id: 're_123' });

      await service.refundPayment('order-123', 0);

      expect(stripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        amount: undefined,
      });
    });

    it('should handle partial refund with very large amount', async () => {
      const paidOrder = {
        ...mockOrder,
        isPaid: true,
        paymentIntentId: 'pi_123',
      };
      orderRepo.findOne.mockResolvedValue(paidOrder as any);
      stripe.refunds.create.mockResolvedValue({ id: 're_123' });

      await service.refundPayment('order-123', 999999.99);

      expect(stripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        amount: 99999999,
      });
    });

    it('should throw error when orderId is null', async () => {
      orderRepo.findOne.mockResolvedValue(null);
      await expect(service.refundPayment(null as any)).rejects.toThrow(NotFoundException);
      expect(orderRepo.findOne).toHaveBeenCalledWith({ where: { id: null } });
    });

    it('should throw error when orderId is undefined', async () => {
      orderRepo.findOne.mockResolvedValue(null);
      await expect(service.refundPayment(undefined as any)).rejects.toThrow(NotFoundException);
      expect(orderRepo.findOne).toHaveBeenCalledWith({ where: { id: undefined } });
    });

    it('should throw error when orderId is empty string', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.refundPayment('')).rejects.toThrow(NotFoundException);
    });

    it('should handle negative refund amount', async () => {
      const paidOrder = {
        ...mockOrder,
        isPaid: true,
        paymentIntentId: 'pi_123',
      };
      orderRepo.findOne.mockResolvedValue(paidOrder as any);
      stripe.refunds.create.mockResolvedValue({ id: 're_123' });

      await service.refundPayment('order-123', -10);

      expect(stripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        amount: -1000,
      });
    });
  });

  describe('handleWebhook', () => {
    it('should handle payment_intent.succeeded event', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            ...mockPaymentIntent,
            metadata: {
              orderId: 'order-123',
              userId: 'user-123',
            },
          },
        },
      };
      orderRepo.findOne.mockResolvedValue(mockOrder as any);

      await service.handleWebhook(event);

      expect(orderRepo.update).toHaveBeenCalledWith('order-123', {
        paymentStatus: PaymentStatus.COMPLETED,
        isPaid: true,
      });
      expect(paymentGateway.notifyPaymentStatus).toHaveBeenCalledWith(
        'user-123',
        {
          orderId: 'order-123',
          status: PaymentStatus.COMPLETED.toString(),
          paymentIntentId: 'pi_123',
        },
      );
    });

    it('should handle payment_intent.payment_failed event', async () => {
      const event = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            ...mockPaymentIntent,
            status: 'failed',
            last_payment_error: {
              message: 'Card declined',
            },
            metadata: {
              orderId: 'order-123',
              userId: 'user-123',
            },
          },
        },
      };
      orderRepo.findOne.mockResolvedValue(mockOrder as any);

      await service.handleWebhook(event);

      expect(orderRepo.update).toHaveBeenCalledWith('order-123', {
        paymentStatus: PaymentStatus.FAILED,
        isPaid: false,
      });
      expect(paymentGateway.notifyPaymentStatus).toHaveBeenCalledWith(
        'user-123',
        {
          orderId: 'order-123',
          status: PaymentStatus.FAILED.toString(),
          paymentIntentId: 'pi_123',
          errorMessage: 'Card declined',
        },
      );
    });

    it('should handle payment_intent.canceled event', async () => {
      const event = {
        type: 'payment_intent.canceled',
        data: {
          object: {
            ...mockPaymentIntent,
            metadata: {
              orderId: 'order-123',
              userId: 'user-123',
            },
          },
        },
      };
      orderRepo.findOne.mockResolvedValue(mockOrder as any);

      await service.handleWebhook(event);

      expect(orderRepo.update).toHaveBeenCalledWith('order-123', {
        paymentStatus: PaymentStatus.FAILED,
        isPaid: false,
      });
      expect(paymentGateway.notifyPaymentStatus).toHaveBeenCalledWith(
        'user-123',
        {
          orderId: 'order-123',
          status: 'CANCELLED',
          paymentIntentId: 'pi_123',
        },
      );
    });

    it('should handle charge.refunded event (no action)', async () => {
      const event = {
        type: 'charge.refunded',
        data: {
          object: {},
        },
      };

      await service.handleWebhook(event);

      expect(orderRepo.update).not.toHaveBeenCalled();
      expect(paymentGateway.notifyPaymentStatus).not.toHaveBeenCalled();
    });

    it('should handle unknown event type (no action)', async () => {
      const event = {
        type: 'unknown.event',
        data: {
          object: {},
        },
      };

      await service.handleWebhook(event);

      expect(orderRepo.update).not.toHaveBeenCalled();
      expect(paymentGateway.notifyPaymentStatus).not.toHaveBeenCalled();
    });

    it('should handle payment_intent.succeeded event without orderId in metadata', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            ...mockPaymentIntent,
            metadata: {},
          },
        },
      };

      await service.handleWebhook(event);

      expect(orderRepo.update).not.toHaveBeenCalled();
      expect(paymentGateway.notifyPaymentStatus).not.toHaveBeenCalled();
    });

    it('should handle payment_intent.payment_failed event without orderId in metadata', async () => {
      const event = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            ...mockPaymentIntent,
            metadata: {},
          },
        },
      };

      await service.handleWebhook(event);

      expect(orderRepo.update).not.toHaveBeenCalled();
      expect(paymentGateway.notifyPaymentStatus).not.toHaveBeenCalled();
    });

    it('should handle payment_intent.payment_failed event without error message', async () => {
      const event = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            ...mockPaymentIntent,
            last_payment_error: null,
            metadata: {
              orderId: 'order-123',
              userId: 'user-123',
            },
          },
        },
      };
      orderRepo.findOne.mockResolvedValue(mockOrder as any);

      await service.handleWebhook(event);

      expect(paymentGateway.notifyPaymentStatus).toHaveBeenCalledWith(
        'user-123',
        {
          orderId: 'order-123',
          status: PaymentStatus.FAILED.toString(),
          paymentIntentId: 'pi_123',
          errorMessage: 'Payment failed',
        },
      );
    });

    it('should handle payment_intent.succeeded event when order user is null', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            ...mockPaymentIntent,
            metadata: {
              orderId: 'order-123',
              userId: 'user-123',
            },
          },
        },
      };
      const orderWithoutUser = {
        ...mockOrder,
        user: null,
      };
      orderRepo.findOne.mockResolvedValue(orderWithoutUser as any);

      await service.handleWebhook(event);

      expect(orderRepo.update).toHaveBeenCalled();
      expect(paymentGateway.notifyPaymentStatus).not.toHaveBeenCalled();
    });

    it('should handle payment_intent.succeeded event when order is not found after update', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            ...mockPaymentIntent,
            metadata: {
              orderId: 'order-123',
              userId: 'user-123',
            },
          },
        },
      };
      orderRepo.findOne.mockResolvedValue(null);

      await service.handleWebhook(event);

      expect(orderRepo.update).toHaveBeenCalledWith('order-123', {
        paymentStatus: PaymentStatus.COMPLETED,
        isPaid: true,
      });
      expect(paymentGateway.notifyPaymentStatus).not.toHaveBeenCalled();
    });

    it('should propagate errors from webhook handlers', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            ...mockPaymentIntent,
            metadata: {
              orderId: 'order-123',
              userId: 'user-123',
            },
          },
        },
      };
      orderRepo.update.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.handleWebhook(event)).rejects.toThrow('Database error');
    });

    it('should handle null event', async () => {
      await expect(service.handleWebhook(null as any)).rejects.toThrow();
    });

    it('should handle event with null data', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: null,
      };

      await expect(service.handleWebhook(event as any)).rejects.toThrow();
    });

    it('should handle event with undefined data object', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: undefined,
        },
      };

      await expect(service.handleWebhook(event as any)).rejects.toThrow();
    });
  });

  describe('handlePaymentSuccess (private)', () => {
    it('should update order status to COMPLETED and notify user', async () => {
      const paymentIntent = {
        ...mockPaymentIntent,
        metadata: {
          orderId: 'order-123',
          userId: 'user-123',
        },
      };
      orderRepo.findOne.mockResolvedValue(mockOrder as any);

      await (service as any).handlePaymentSuccess(paymentIntent);

      expect(orderRepo.update).toHaveBeenCalledWith('order-123', {
        paymentStatus: PaymentStatus.COMPLETED,
        isPaid: true,
      });
      expect(paymentGateway.notifyPaymentStatus).toHaveBeenCalledWith(
        'user-123',
        {
          orderId: 'order-123',
          status: PaymentStatus.COMPLETED.toString(),
          paymentIntentId: 'pi_123',
        },
      );
    });

    it('should return early when orderId is not in metadata', async () => {
      const paymentIntent = {
        ...mockPaymentIntent,
        metadata: {},
      };

      await (service as any).handlePaymentSuccess(paymentIntent);

      expect(orderRepo.update).not.toHaveBeenCalled();
      expect(paymentGateway.notifyPaymentStatus).not.toHaveBeenCalled();
    });

    it('should handle null payment intent', async () => {
      await expect((service as any).handlePaymentSuccess(null)).rejects.toThrow();
    });
  });

  describe('handlePaymentFailure (private)', () => {
    it('should update order status to FAILED and notify user with error message', async () => {
      const paymentIntent = {
        ...mockPaymentIntent,
        last_payment_error: {
          message: 'Insufficient funds',
        },
        metadata: {
          orderId: 'order-123',
          userId: 'user-123',
        },
      };
      orderRepo.findOne.mockResolvedValue(mockOrder as any);

      await (service as any).handlePaymentFailure(paymentIntent);

      expect(orderRepo.update).toHaveBeenCalledWith('order-123', {
        paymentStatus: PaymentStatus.FAILED,
        isPaid: false,
      });
      expect(paymentGateway.notifyPaymentStatus).toHaveBeenCalledWith(
        'user-123',
        {
          orderId: 'order-123',
          status: PaymentStatus.FAILED.toString(),
          paymentIntentId: 'pi_123',
          errorMessage: 'Insufficient funds',
        },
      );
    });

    it('should use default error message when last_payment_error is null', async () => {
      const paymentIntent = {
        ...mockPaymentIntent,
        last_payment_error: null,
        metadata: {
          orderId: 'order-123',
          userId: 'user-123',
        },
      };
      orderRepo.findOne.mockResolvedValue(mockOrder as any);

      await (service as any).handlePaymentFailure(paymentIntent);

      expect(paymentGateway.notifyPaymentStatus).toHaveBeenCalledWith(
        'user-123',
        {
          orderId: 'order-123',
          status: PaymentStatus.FAILED.toString(),
          paymentIntentId: 'pi_123',
          errorMessage: 'Payment failed',
        },
      );
    });

    it('should return early when orderId is not in metadata', async () => {
      const paymentIntent = {
        ...mockPaymentIntent,
        metadata: {},
      };

      await (service as any).handlePaymentFailure(paymentIntent);

      expect(orderRepo.update).not.toHaveBeenCalled();
      expect(paymentGateway.notifyPaymentStatus).not.toHaveBeenCalled();
    });

    it('should handle null payment intent', async () => {
      await expect((service as any).handlePaymentFailure(null)).rejects.toThrow();
    });
  });

  describe('handlePaymentCancellation (private)', () => {
    it('should update order status to FAILED and notify user with CANCELLED status', async () => {
      const paymentIntent = {
        ...mockPaymentIntent,
        metadata: {
          orderId: 'order-123',
          userId: 'user-123',
        },
      };
      orderRepo.findOne.mockResolvedValue(mockOrder as any);

      await (service as any).handlePaymentCancellation(paymentIntent);

      expect(orderRepo.update).toHaveBeenCalledWith('order-123', {
        paymentStatus: PaymentStatus.FAILED,
        isPaid: false,
      });
      expect(paymentGateway.notifyPaymentStatus).toHaveBeenCalledWith(
        'user-123',
        {
          orderId: 'order-123',
          status: 'CANCELLED',
          paymentIntentId: 'pi_123',
        },
      );
    });

    it('should return early when orderId is not in metadata', async () => {
      const paymentIntent = {
        ...mockPaymentIntent,
        metadata: {},
      };

      await (service as any).handlePaymentCancellation(paymentIntent);

      expect(orderRepo.update).not.toHaveBeenCalled();
      expect(paymentGateway.notifyPaymentStatus).not.toHaveBeenCalled();
    });

    it('should handle null payment intent', async () => {
      await expect((service as any).handlePaymentCancellation(null)).rejects.toThrow();
    });
  });
});
