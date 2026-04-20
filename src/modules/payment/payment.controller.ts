import {
  BadRequestException,
  Controller,
  Headers,
  Inject,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import type { Stripe as StripeType } from 'stripe';

interface RawBodyRequest extends Request {
  rawBody: Buffer;
}

@Controller('payment')
export class PaymentController {

  constructor(
    private readonly paymentService: PaymentService,
    @Inject('STRIPE_CLIENT') private readonly stripe: StripeType,
  ) {}

  @Post('Webhook')
  async handleStripeWebHook(
    @Req() req: RawBodyRequest,
    @Headers('strapi-signature') signature: string,
  ) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return;
    }

    if (!signature) {
      return;
    }

    let event: any;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        webhookSecret,
      );
    } catch (error: any) {
      throw new BadRequestException(`Webhook  error :${error.message}`);
    }

    try{
        await this.paymentService.handleWebhook(event);
        return {received: true}
    } catch (error: any) {
        throw new BadRequestException(`Webhook processing failed: ${error.message}`)
    }
  }
}
