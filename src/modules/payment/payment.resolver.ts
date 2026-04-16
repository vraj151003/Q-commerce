import { Injectable } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { PaymentService } from './payment.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
class CreatePaymentIntentResponse {
  @Field()
  clientSecret: string;

  @Field()
  paymentIntentId: string;
}

@Injectable()
@Resolver()
export class PaymentResolver {
  constructor(private paymentService: PaymentService) {}

  @Mutation(() => CreatePaymentIntentResponse, {
    description: 'Create a Stripe Payment Intent for an order',
  })
  @UseGuards(GqlAuthGuard)
  async createPaymentIntent(
    @Args('orderId') orderId: string,
    @Context() context: any,
  ): Promise<CreatePaymentIntentResponse> {
    const user = context.req.user;
    const result = await this.paymentService.createPaymentIntent(orderId);

    return result;
  }

  @Mutation(() => Boolean, {
    description: 'Refund a payment (full or partial)',
  })
  @UseGuards(GqlAuthGuard)
  async refundPayment(
    @Args('orderId') orderId: string,
    @Args('amount', { nullable: true, description: 'Partial refund amount' })
    amount?: number,
    @Context() context?: any,
  ): Promise<boolean> {
    await this.paymentService.refundPayment(orderId, amount);
    return true;
  }
}
