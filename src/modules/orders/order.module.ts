// src/order/order.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from './entity/order.entity';
import { OrderItem } from './entity/order-item.entity';
import { Cart } from '../cart/entity/cart.entity';

import { OrderService } from './order.service';
import { OrderResolver } from './order.resolver';

import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Product } from '../products/entity/product.entity';
import { registerEnumType } from '@nestjs/graphql';
import { paymentMethod, PaymentStatus } from 'src/common/constant/status';

// Register enums for GraphQL schema
registerEnumType(paymentMethod, {
  name: 'paymentMethod',
  description: 'Available payment methods for orders',
});

registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
  description: 'Payment status for orders',
});

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Cart, Product]),
  ],
  providers: [
    OrderService,
    OrderResolver,
    GqlAuthGuard,
    RolesGuard,
  ],
  exports: [OrderService],
})
export class OrderModule {}