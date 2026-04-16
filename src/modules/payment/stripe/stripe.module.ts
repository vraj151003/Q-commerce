import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Global()
@Module({
  providers: [
    {
      provide: 'STRIPE_CLIENT',
      useFactory: (configService: ConfigService) => {
        const stripeSecretKey = configService.get('STRIPE_SECRET_KEY');
        if (!stripeSecretKey) {
          throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
        }
        return new Stripe(stripeSecretKey, {
          apiVersion: '2026-03-25.dahlia',
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['STRIPE_CLIENT'],
})
export class StripeModule {}