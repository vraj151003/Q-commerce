// src/order/order.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entity/order.entity';
import { OrderItem } from './entity/order-item.entity';
import { Cart } from '../cart/entity/cart.entity';
import { OrderService } from './order.service';
import { OrderResolver } from './order.resolver';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Product } from '../products/entity/product.entity';
import { DeliveryAssignmentModule } from '../delivery-assignment/delivery-assignment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Cart, Product]),
    DeliveryAssignmentModule,
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