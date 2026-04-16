import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../orders/entity/order.entity';
import { Repository } from 'typeorm';
import { PaymentStatus } from 'src/common/constant/status';
import { PaymentGateway } from './payment.gateway';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @Inject('STRIPE_CLIENT')
    private stripe: any,

    private paymentGateway: PaymentGateway,
  ) {}

  async createPaymentIntent(orderId: string): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['user'],
    });
    if (!order) {
      throw new NotFoundException('Order Not Found');
    }
    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException('payment already processed');
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100),
      currency: 'usd',
      metadata: {
        orderId: order.id,
        userId: order.user.id,
      },
      description: `Payment for order ${order.id}`,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });

    await this.orderRepo.update(order.id, {
      paymentIntentId: paymentIntent.id,
      paymentStatus: PaymentStatus.PROCESSING,
    });

    this.paymentGateway.notifyPaymentStatus(order.user.id, {
      orderId: order.id,
      status: PaymentStatus.PROCESSING.toString(),
      paymentIntentId: paymentIntent.id,
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  }

  // Optional: Only use this if you need manual confirmation from backend
  async confirnPayment(
    paymentIntentId: string,
    orderId?: string,
  ): Promise<Order> {
    const paymentIntent =
      await this.stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException(
        `Payment not successful. Status: ${paymentIntent.status}`,
      );
    }

    const order = await this.orderRepo.findOne({
      where: { paymentIntentId },
      relations: ['user'],
    });

    if (!order) throw new NotFoundException('Order not found');
    if(orderId && order.id !== orderId){
      throw new BadRequestException('Payment intent does not belong to this order')
    }

    await this.orderRepo.update(order.id , {
      paymentStatus : PaymentStatus.COMPLETED,
      isPaid : true,
    })

    this.paymentGateway.notifyPaymentStatus(order.user.id,{
      orderId : order.id,
      status : PaymentStatus.COMPLETED.toString(),
      paymentIntentId : paymentIntentId,
    })

    return order;
  }

  async refundPayment(orderId : string, amount?: number) : Promise<{refundId : string}>{
    const order = await this.orderRepo.findOne({ where: { id: orderId } });

    if (!order) throw new NotFoundException('Order not found');
    if (!order.isPaid || !order.paymentIntentId) {
      throw new BadRequestException('Order is not paid or missing payment intent');
    }

    const refund = await this.stripe.refunds.create({
      payment_intent: order.paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    })

    await this.orderRepo.update(orderId ,{
      paymentStatus : PaymentStatus.REFUNDED,
      isPaid : false,
    })

    return { refundId: refund.id };
  }

  async handleWebhook(event: any): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as any);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object as any);
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentCancellation(event.data.object as any);
          break;

        case 'charge.refunded':
          break;

        default:
      }
    } catch (error) {
      throw error;
    }
  }

  private async handlePaymentSuccess(paymentIntent: any): Promise<void> {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) return;

    await this.orderRepo.update(orderId, {
      paymentStatus: PaymentStatus.COMPLETED,
      isPaid: true,
    });

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    if (order?.user) {
      this.paymentGateway.notifyPaymentStatus(order.user.id, {
        orderId: order.id,
        status: PaymentStatus.COMPLETED.toString(),
        paymentIntentId: paymentIntent.id,
      });
    }
  }

  private async handlePaymentFailure(paymentIntent: any): Promise<void> {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) return;

    await this.orderRepo.update(orderId, {
      paymentStatus: PaymentStatus.FAILED,
      isPaid: false,
    });

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    if (order?.user) {
      this.paymentGateway.notifyPaymentStatus(order.user.id, {
        orderId: order.id,
        status: PaymentStatus.FAILED.toString(),
        paymentIntentId: paymentIntent.id,
        errorMessage: paymentIntent.last_payment_error?.message || 'Payment failed',
      });
    }
  }

  private async handlePaymentCancellation(paymentIntent: any): Promise<void> {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) return;

    await this.orderRepo.update(orderId, {
      paymentStatus: PaymentStatus.FAILED,
      isPaid: false,
    });

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    if (order?.user) {
      this.paymentGateway.notifyPaymentStatus(order.user.id, {
        orderId: order.id,
        status: 'CANCELLED',
        paymentIntentId: paymentIntent.id,
      });
    }
  }
}
