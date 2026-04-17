import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeModule } from './stripe/stripe.module';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentResolver } from './payment.resolver';
import { PaymentGateway } from './payment.gateway';
import { Order } from '../orders/entity/order.entity';
import { Payment } from './entity/payment.entity';
import { WsJwtAuthGuard } from './ws-jwt-auth.guard';

@Module({
  imports: [StripeModule, TypeOrmModule.forFeature([Order, Payment])],
  providers: [PaymentService, PaymentResolver, PaymentGateway, WsJwtAuthGuard],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
